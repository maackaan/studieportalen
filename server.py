#!/usr/bin/env python3
"""Lokal server för Studieportalen med kursuppslag mot officiella källor."""

from __future__ import annotations

import html
import json
import os
import re
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
USER_AGENT = "Studieportalen/1.2 (+local personal study organizer)"
CONTENT_SECURITY_POLICY = (
    "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; "
    "style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; "
    "frame-src blob:; worker-src 'self'; manifest-src 'self'; form-action 'self'"
)


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value, flags=re.S)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def fetch_html(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "sv,en;q=0.8"})
    with urlopen(request, timeout=8) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read(2_500_000).decode(charset, errors="replace")


def fetch_json(url: str) -> dict | list:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read(5_000_000).decode("utf-8"))


def extract(pattern: str, source: str) -> str:
    match = re.search(pattern, source, flags=re.I | re.S)
    return clean_text(match.group(1)) if match else ""


def discover_liu_course_home(code: str) -> str:
    """Hitta IDA:s offentliga kurshemsida när den finns för kurskoden."""
    url = f"https://www.ida.liu.se/~{code}/"
    try:
        source = fetch_html(url)
    except (HTTPError, URLError, TimeoutError):
        return ""
    title = extract(r"<title[^>]*>(.*?)</title>", source)
    if code not in source.upper() or "STUDIEINFO" in title.upper():
        return ""
    return url


def lookup_liu(code: str) -> dict:
    url = f"https://studieinfo.liu.se/kurs/{code}"
    source = fetch_html(url)
    title = extract(r"<title[^>]*>(.*?)</title>", source)
    heading = extract(r"<h1[^>]*>(.*?)</h1>", source)
    if not title or "Studieinfo" not in title or code not in source.upper():
        raise LookupError("Kursen hittades inte hos LiU.")
    name = re.sub(rf"^{re.escape(code)}\s+", "", title, flags=re.I)
    name = re.sub(r"\s+-\s+Studieinfo.*$", "", name, flags=re.I).strip()
    credits_match = re.search(r"([0-9]+(?:[,.][0-9]+)?)\s*hp", heading, flags=re.I)
    description = extract(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', source)
    if not description:
        description = extract(r"<h2[^>]*>\s*Kursinneh.*?</h2>(.*?)(?=<h2)", source)
    return {
        "code": code,
        "name": name or heading or code,
        "credits": f"{credits_match.group(1)} hp" if credits_match else "",
        "url": url,
        "courseHomeUrl": discover_liu_course_home(code),
        "scheduleUrl": "https://cloud.timeedit.net/liu/web/schema/",
        "description": description,
    }


def lookup_kth(code: str) -> dict:
    url = f"https://www.kth.se/student/kurser/kurs/{code}?l=sv"
    source = fetch_html(url)
    heading = extract(r"<h1[^>]*>(.*?)</h1>", source)
    title = extract(r"<title[^>]*>(.*?)</title>", source)
    text = heading or title
    if not text or code not in source.upper():
        raise LookupError("Kursen hittades inte hos KTH.")
    name = re.sub(rf"^{re.escape(code)}\s*", "", text, flags=re.I)
    name = re.sub(r"\s*[|\-]\s*KTH.*$", "", name, flags=re.I).strip()
    credits_match = re.search(r"([0-9]+(?:[,.][0-9]+)?)\s*(?:hp|credits)", text, flags=re.I)
    if credits_match:
        name = re.sub(rf"\s*{re.escape(credits_match.group(0))}.*$", "", name, flags=re.I).strip()
    description = extract(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', source)
    return {
        "code": code,
        "name": name or code,
        "credits": f"{credits_match.group(1)} hp" if credits_match else "",
        "url": url,
        "courseHomeUrl": "https://canvas.kth.se/",
        "scheduleUrl": "https://www.kth.se/student/studier/schema",
        "description": description,
    }


def lookup_chalmers(code: str) -> dict:
    url = f"https://www.chalmers.se/utbildning/dina-studier/hitta-kurs-och-programplaner/kursplaner/{code}/"
    source = fetch_html(url)
    heading = extract(r"<h1[^>]*>(.*?)</h1>", source)
    if not heading or code not in source.upper():
        raise LookupError("Kursen hittades inte hos Chalmers.")
    name = re.sub(r"^(?:Sök kursplan|Kursplan för)\s*", "", heading, flags=re.I).strip()
    credits_match = re.search(r"(?:Omfattning\s*)?([0-9]+(?:[,.][0-9]+)?)\s*(?:Högskolepoäng|hp)", clean_text(source), flags=re.I)
    description = extract(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', source)
    return {
        "code": code,
        "name": name or code,
        "credits": f"{credits_match.group(1)} hp" if credits_match else "",
        "url": url,
        "courseHomeUrl": "https://canvas.chalmers.se/",
        "scheduleUrl": "https://cloud.timeedit.net/chalmers/web/public/",
        "description": description,
    }


def lookup_lth(code: str) -> dict:
    """Slår upp aktuella LTH-kurser via LTH:s offentliga kursplans-API."""
    api_root = "https://api.lth.lu.se/kursplaner"
    rounds = fetch_json(f"{api_root}/planeringsomgangar")
    if not isinstance(rounds, list):
        raise LookupError("Kursen hittades inte hos Lunds universitet.")

    # En aktuell omgång per katalogtyp räcker och undviker att hämta många stora kataloger.
    current_rounds = []
    seen_series = set()
    for item in rounds:
        series = item.get("planSerieId")
        key = item.get("key")
        if key and series not in seen_series:
            current_rounds.append(key)
            seen_series.add(series)

    for key in current_rounds[:6]:
        catalogue = fetch_json(f"{api_root}/planeringsomgangar/{key}")
        if not isinstance(catalogue, dict):
            continue
        course = next((item for item in catalogue.get("kurser", []) if item.get("kurskod", "").upper() == code), None)
        if not course:
            continue
        path = course.get("kursplanSveUrl") or course.get("kursplanEngUrl")
        if not path:
            continue
        url = f"https://kurser.lth.se{path}" if path.startswith("/") else path
        source = fetch_html(url)
        heading = extract(r"<h1[^>]*>(.*?)</h1>", source)
        credits_match = re.search(rf"{re.escape(code)}\s*,\s*([0-9]+(?:[,.][0-9]+)?)\s*högskolepoäng", clean_text(source), flags=re.I)
        return {
            "code": code,
            "name": course.get("kursSve") or course.get("kursEng") or heading or code,
            "credits": f"{credits_match.group(1).replace('.', ',')} hp" if credits_match else "",
            "url": url,
            "courseHomeUrl": "https://canvas.education.lu.se/",
            "scheduleUrl": "https://cloud.timeedit.net/lu/web/",
            "description": f"Aktuell kursplan från LTH:s officiella kurskatalog ({catalogue.get('lasar', '')}).".replace(" ().", "."),
        }
    raise LookupError("Kursen hittades inte hos Lunds universitet.")


def lookup_lund(code: str) -> dict:
    """Slår först upp LU:s gemensamma kurswebb och använder LTH som reservväg."""
    url = f"https://www.lu.se/studera/{code}"
    try:
        source = fetch_html(url)
        heading = extract(r"<h1[^>]*>(.*?)</h1>", source)
        if heading and code in source.upper():
            credits_match = re.search(r"([0-9]+(?:[,.][0-9]+)?)\s*högskolepoäng", clean_text(source), flags=re.I)
            description = extract(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', source)
            if not description:
                description = extract(r'<p[^>]+class=["\'][^"\']*body-text[^"\']*["\'][^>]*>(.*?)</p>', source)
            return {
                "code": code,
                "name": heading,
                "credits": f"{credits_match.group(1).replace('.', ',')} hp" if credits_match else "",
                "url": url,
                "courseHomeUrl": "https://canvas.education.lu.se/",
                "scheduleUrl": "https://cloud.timeedit.net/lu/web/",
                "description": description,
            }
    except HTTPError as error:
        if error.code != 404:
            raise
    return lookup_lth(code)


LOOKUPS = {"liu": lookup_liu, "kth": lookup_kth, "chalmers": lookup_chalmers, "lund": lookup_lund}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/course-search":
            self.course_search(parsed.query)
            return
        super().do_GET()

    def end_headers(self) -> None:
        self.send_header("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()

    def course_search(self, query: str) -> None:
        params = parse_qs(query)
        university = params.get("university", [""])[0].lower()
        code = params.get("q", [""])[0].strip().upper()
        if university not in LOOKUPS or not re.fullmatch(r"[A-ZÅÄÖ0-9-]{3,16}", code):
            self.send_json(HTTPStatus.BAD_REQUEST, {"message": "Ogiltigt universitet eller kurskod."})
            return
        try:
            course = LOOKUPS[university](code)
            self.send_json(HTTPStatus.OK, {"course": course, "source": "official"})
        except (HTTPError, URLError, TimeoutError, LookupError) as error:
            if isinstance(error, HTTPError) and error.code == 404:
                message = "Kursen hittades inte."
            elif isinstance(error, LookupError):
                message = str(error)
            else:
                message = "Universitetets kurskatalog svarar inte just nu."
            self.send_json(HTTPStatus.NOT_FOUND, {"message": message})
        except Exception:
            self.send_json(HTTPStatus.BAD_GATEWAY, {"message": "Kursinformationen kunde inte hämtas just nu."})

    def send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[studieportalen] {fmt % args}", file=sys.stderr)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    host = os.environ.get("STUDIEPORTALEN_HOST", "127.0.0.1")
    server = ThreadingHTTPServer((host, port), Handler)
    display_host = "localhost" if host in {"127.0.0.1", "::1"} else host
    print(f"Studieportalen körs på http://{display_host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
