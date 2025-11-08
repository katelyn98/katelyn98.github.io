#!/usr/bin/env python3
"""
Fetch BibTeX records from a Google Scholar profile and write them to a file.

The script relies on the `scholarly` package which scrapes information from
Scholar HTML pages. Make sure you respect Google Scholar's Terms of Service
and rate limits when using this script.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
import unicodedata
from typing import Iterable, List, Tuple

try:
    from scholarly import scholarly  # type: ignore
except ImportError as exc:  # pragma: no cover - friendly error for missing dep
    print(
        "scholarly is not installed. Install it with `pip install scholarly`.",
        file=sys.stderr,
    )
    raise


REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Download publications from a Google Scholar profile "
            "and store them as BibTeX."
        )
    )
    parser.add_argument(
        "scholar_id",
        help=(
            "Google Scholar user identifier or profile URL "
            "(e.g. https://scholar.google.com/citations?user=<ID>)."
        ),
    )
    parser.add_argument(
        "-o",
        "--output",
        default="_bibliography/papers.bib",
        help="Destination path for the generated BibTeX file.",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=None,
        help="Limit the number of publications that are exported.",
    )
    parser.add_argument(
        "--no-front-matter",
        action="store_true",
        help="Do not prepend the `---` front matter required by Jekyll data files.",
    )
    return parser.parse_args()


def extract_user_id(raw_value: str) -> str:
    """
    Accept either a scholar ID or a citations profile URL.

    Examples
    --------
    - 'https://scholar.google.com/citations?user=ABC123&hl=en' -> 'ABC123'
    - 'ABC123' -> 'ABC123'
    """

    match = re.search(r"[?&]user=([a-zA-Z0-9_-]+)", raw_value)
    if match:
        return match.group(1)
    return raw_value


def fetch_publications(
    scholar_id: str, limit: int | None = None
) -> Iterable[Tuple[str, int]]:
    """
    Yield `(bibtex, year)` tuples for every publication on the profile.
    """

    author = scholarly.search_author_id(scholar_id)
    if author is None:
        raise RuntimeError(f"No Google Scholar profile found for id '{scholar_id}'.")

    author = scholarly.fill(author, sections=["publications"])
    publications = author.get("publications", [])

    if limit is not None:
        publications = publications[:limit]

    for publication in publications:
        filled = scholarly.fill(publication)
        bib_section = filled.get("bib", {})

        # scholarly.bibtex() returns a string representation of the entry.
        bibtex = format_bibtex_entry(filled)
        year = bib_section.get("pub_year") or bib_section.get("year")
        try:
            year_int = int(year)
        except (TypeError, ValueError):
            year_int = 0

        yield bibtex, year_int


def format_bibtex_entry(publication: dict) -> str:
    """
    Try to serialize the publication using scholarly's helper first.
    If that fails (e.g., missing ENTRYTYPE), fall back to a minimal BibTeX entry.
    """

    try:
        text = scholarly.bibtex(publication)
        if text:
            return ensure_custom_fields(text.strip(), publication)
    except KeyError:
        pass

    bib_section = publication.get("bib", {})
    if not bib_section:
        raise RuntimeError("Publication record is missing the 'bib' section.")

    entry_type = guess_entry_type(bib_section)
    citekey = make_citekey(bib_section)
    fields = build_field_lines(bib_section)

    field_body = ",\n".join(fields)
    entry_text = f"@{entry_type}{{{citekey},\n{field_body}\n}}"
    return ensure_custom_fields(entry_text, publication)


def guess_entry_type(bib: dict) -> str:
    pub_type = (bib.get("pub_type") or "").lower()
    if "journal" in pub_type:
        return "article"
    if any(keyword in pub_type for keyword in ("conf", "proceeding", "symposium")):
        return "inproceedings"

    if bib.get("journal"):
        return "article"
    if bib.get("booktitle"):
        return "inproceedings"
    return "misc"


def make_citekey(bib: dict) -> str:
    authors = bib.get("author", "") or ""
    first_author = authors.split(" and ")[0].strip()
    last_name = first_author.split(" ")[-1] if first_author else "pub"

    year = bib.get("pub_year") or bib.get("year") or "nd"
    title = bib.get("title") or "work"
    title_slug = slugify(title)[:10]

    return f"{slugify(last_name)}{year}{title_slug}".strip()


def build_field_lines(bib: dict) -> List[str]:
    preferred_order = [
        ("title", "title"),
        ("author", "author"),
        ("journal", "journal"),
        ("booktitle", "booktitle"),
        ("publisher", "publisher"),
        ("volume", "volume"),
        ("number", "number"),
        ("pages", "pages"),
        ("year", "pub_year"),
        ("year", "year"),
        ("url", "url"),
    ]

    seen = set()
    lines = []
    for field_name, source_key in preferred_order:
        if field_name in seen:
            continue
        value = bib.get(source_key)
        if value:
            processed_value = (
                shorten_author_field(value)
                if field_name == "author"
                else sanitize_bib_value(value)
            )
            lines.append(f"  {field_name} = {{{processed_value}}}")
            seen.add(field_name)

    # Add any remaining fields that were not explicitly ordered.
    for key, value in bib.items():
        normalized = key.lower()
        if normalized in seen:
            continue
        if value:
            processed_value = (
                shorten_author_field(value)
                if normalized == "author"
                else sanitize_bib_value(value)
            )
            lines.append(f"  {normalized} = {{{processed_value}}}")
            seen.add(normalized)

    if not lines:
        lines.append("  note = {Details unavailable}")
    return lines


def ensure_custom_fields(entry_text: str, publication: dict) -> str:
    """
    Insert abbr/bibtex_show fields if they are not already present.
    """

    bib = publication.get("bib", {})
    lines = entry_text.splitlines()
    if not lines:
        return entry_text

    header = lines[0]
    body = lines[1:]
    body_text = "\n".join(body).lower()

    insertion = []
    if "abbr" not in body_text:
        insertion.append(f"  abbr = {{{determine_abbr(bib)}}},")
    if "bibtex_show" not in body_text:
        insertion.append("  bibtex_show = {true},")

    html_value = determine_html(publication)
    if html_value and "html" not in body_text:
        insertion.append(f"  html = {{{sanitize_bib_value(html_value)}}},")

    if not insertion:
        return entry_text

    return "\n".join([header] + insertion + body)


def determine_abbr(bib: dict) -> str:
    """
    Returns 'workshop' if any textual field mentions a workshop, else 'conference'.
    """

    fields_to_check = [
        "title",
        "booktitle",
        "journal",
        "abstract",
        "citation",
        "note",
    ]

    for field in fields_to_check:
        value = bib.get(field)
        if value and "workshop" in str(value).lower():
            return "Workshop Paper"
    return "Conference Paper"


def determine_html(publication: dict) -> str | None:
    """
    Pick the best candidate URL to surface as the HTML field.
    """

    bib = publication.get("bib", {})
    candidates = [
        publication.get("pub_url"),
        publication.get("eprint_url"),
        bib.get("url"),
        bib.get("link"),
        bib.get("pdf"),
    ]

    for value in candidates:
        if not value:
            continue
        value_str = str(value).strip()
        if value_str:
            return value_str
    return None


def sanitize_bib_value(raw: object) -> str:
    text = str(raw)
    collapsed = unicodedata.normalize("NFKC", text).replace("\n", " ").strip()
    collapsed = re.sub(r"\s+", " ", collapsed)
    return collapsed.replace("{", "\\{").replace("}", "\\}")


def shorten_author_field(raw: object, limit: int = 10) -> str:
    """
    Trim author lists longer than `limit` and append 'et al.'.
    """

    text = sanitize_bib_value(raw)
    authors = [name.strip() for name in text.split(" and ") if name.strip()]
    if len(authors) <= limit:
        return " and ".join(authors)
    return " and ".join(authors[:limit] + ["et al."])


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "", normalized.lower())
    return cleaned or "item"


def construct_document(entries: List[Tuple[str, int]], include_front_matter: bool) -> str:
    """
    Combine all BibTeX entries into a single string, sorted by year descending.
    """

    entries.sort(key=lambda item: item[1], reverse=True)
    body = "\n\n".join(entry for entry, _ in entries).strip()
    body = f"{body}\n" if body else ""

    if include_front_matter:
        return f"---\n---\n\n{body}"
    return body


def main() -> None:
    args = parse_args()
    scholar_id = extract_user_id(args.scholar_id)
    output_path = resolve_output_path(args.output)

    existing_text = ""
    existing_front_matter = ""
    existing_body = ""
    existing_keys: set[str] = set()

    if output_path.exists():
        existing_text = output_path.read_text(encoding="utf-8")
        existing_front_matter, existing_body = split_front_matter(existing_text)
        existing_keys = extract_bib_keys(existing_body)

    try:
        entries = list(fetch_publications(scholar_id, args.max_results))
    except Exception as exc:  # pragma: no cover - surface scrape errors to user
        print(f"Failed to fetch publications: {exc}", file=sys.stderr)
        sys.exit(1)

    if not entries:
        print("No publications returned from Google Scholar.", file=sys.stderr)
        sys.exit(1)

    include_front_matter = not args.no_front_matter

    if not existing_text:
        document = construct_document(entries, include_front_matter)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(document, encoding="utf-8")
        print(f"Wrote {len(entries)} BibTeX entries to {output_path}")
        return

    new_entries: List[str] = []
    for entry, _ in entries:
        cite_key = extract_cite_key(entry)
        if not cite_key or cite_key in existing_keys:
            continue
        new_entries.append(entry)
        existing_keys.add(cite_key)

    if not new_entries:
        print("No new publications to add.")
        return

    new_block = "\n\n".join(new_entries).strip()
    if new_block:
        new_block = f"{new_block}\n\n"

    body = existing_body.lstrip()
    updated_body = f"{new_block}{body}" if body else new_block

    front = existing_front_matter or ("---\n---\n\n" if include_front_matter else "")
    updated_text = f"{front}{updated_body}"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(updated_text, encoding="utf-8")
    print(f"Appended {len(new_entries)} new BibTeX entries to {output_path}")


def resolve_output_path(path_str: str) -> pathlib.Path:
    candidate = pathlib.Path(path_str)
    if candidate.is_absolute():
        return candidate
    return (REPO_ROOT / candidate).resolve()


def split_front_matter(text: str) -> Tuple[str, str]:
    prefix = "---\n---\n\n"
    if text.startswith(prefix):
        return prefix, text[len(prefix) :]
    return "", text


def extract_bib_keys(body: str) -> set[str]:
    return set(re.findall(r"@\w+\{([^,]+),", body))


def extract_cite_key(entry_text: str) -> str | None:
    match = re.match(r"@\w+\{([^,]+),", entry_text.strip())
    if match:
        return match.group(1).strip()
    return None


if __name__ == "__main__":
    main()
