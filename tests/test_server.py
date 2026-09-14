import unittest
from urllib.error import HTTPError
from unittest.mock import patch

import server


class CourseLookupTests(unittest.TestCase):
    def test_clean_text_removes_markup_and_normalizes_spacing(self):
        self.assertEqual(server.clean_text(" <strong>Hej</strong> &amp;   välkommen "), "Hej & välkommen")

    @patch("server.fetch_html")
    def test_liu_lookup(self, fetch_html):
        fetch_html.side_effect = [
            """
                <title>TDDD27 Avancerad webbprogrammering - Studieinfo, Linköpings universitet</title>
                <h1>TDDD27 Avancerad webbprogrammering, 6 hp</h1>
                <meta name="description" content="Bygg moderna webbapplikationer." />
            """,
            "<title>TDDD27 Home page</title><h1>TDDD27 Advanced Web Programming</h1>",
        ]
        course = server.lookup_liu("TDDD27")
        self.assertEqual(course["name"], "Avancerad webbprogrammering")
        self.assertEqual(course["credits"], "6 hp")
        self.assertEqual(course["courseHomeUrl"], "https://www.ida.liu.se/~TDDD27/")
        self.assertIn("timeedit.net/liu", course["scheduleUrl"])

    @patch("server.fetch_html")
    def test_liu_lookup_tolerates_missing_ida_home_page(self, fetch_html):
        fetch_html.side_effect = [
            """
                <title>ETE318 Elektronik - Studieinfo, Linköpings universitet</title>
                <h1>ETE318 Elektronik, 6 hp</h1>
                <h2>Kursinneh&#xE5;ll</h2><p>Analoga och digitala kretsar.</p><h2>Examination</h2>
            """,
            HTTPError("https://www.ida.liu.se/~ETE318/", 404, "Not found", {}, None),
        ]

        course = server.lookup_liu("ETE318")

        self.assertEqual(course["courseHomeUrl"], "")
        self.assertEqual(course["description"], "Analoga och digitala kretsar.")

    @patch("server.fetch_html")
    def test_kth_lookup(self, fetch_html):
        fetch_html.return_value = """
            <title>DD1337 Programmering | KTH</title>
            <h1>DD1337 Programmering 7,0 hp</h1>
            <meta name="description" content="Grundläggande programmering." />
        """
        course = server.lookup_kth("DD1337")
        self.assertEqual(course["name"], "Programmering")
        self.assertEqual(course["credits"], "7,0 hp")

    @patch("server.fetch_html")
    def test_chalmers_lookup(self, fetch_html):
        fetch_html.return_value = """
            <h1>Kursplan för Computer graphics</h1>
            <p>TDA362 Omfattning 7,5 Högskolepoäng</p>
            <meta name="description" content="Grafik och rendering." />
        """
        course = server.lookup_chalmers("TDA362")
        self.assertEqual(course["name"], "Computer graphics")
        self.assertEqual(course["credits"], "7,5 hp")

    @patch("server.fetch_html")
    def test_lund_general_course_page(self, fetch_html):
        fetch_html.return_value = """
            <h1 class="heading">Matematik: Envariabelanalys</h1>
            <p class="subheading">Kurs · Grundnivå · 15 högskolepoäng</p>
            <p class="body-text">En introduktion till analys.</p>
            <span>MATA31</span>
        """
        course = server.lookup_lund("MATA31")
        self.assertEqual(course["name"], "Matematik: Envariabelanalys")
        self.assertEqual(course["credits"], "15 hp")
        self.assertEqual(course["description"], "En introduktion till analys.")

    @patch("server.fetch_json")
    @patch("server.fetch_html")
    def test_lund_falls_back_to_lth(self, fetch_html, fetch_json):
        fetch_html.side_effect = [
            HTTPError("https://www.lu.se/studera/EDAB05", 404, "Not found", {}, None),
            "<h1>Programmering, grundkurs</h1><h2>EDAB05, 10.5 högskolepoäng, G1</h2>",
        ]
        fetch_json.side_effect = [
            [{"planSerieId": 1, "key": "26_27"}],
            {
                "lasar": "2026/27",
                "kurser": [{
                    "kurskod": "EDAB05",
                    "kursSve": "Programmering, grundkurs",
                    "kursEng": "Programming",
                    "kursplanSveUrl": "/kursplaner/26_27/EDAB05.html",
                }],
            },
        ]
        course = server.lookup_lund("EDAB05")
        self.assertEqual(course["name"], "Programmering, grundkurs")
        self.assertEqual(course["credits"], "10,5 hp")
        self.assertIn("2026/27", course["description"])


if __name__ == "__main__":
    unittest.main()
