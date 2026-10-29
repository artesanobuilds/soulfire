# Rebuilding the review

`build_document.py` is the editable authoring source. It regenerates `design.json`, the five SVG diagrams, the PDF and the self-contained HTML in its parent directory. Requires Python 3, ReportLab and svglib; no model, provider or app server is used. PNG diagram previews were rendered from the SVGs through vector PDFs with Poppler (`pdftoppm`).

Edit the builder's page content, rerun it, then visually inspect all pages after rendering with Poppler. `design.json` is a portable content snapshot; changing it alone does not rebuild the PDF. The HTML can be edited or read independently, but regenerate from source to keep PDF/HTML synchronized.

The review is intentionally documentation-only. Numerical generation budgets and release criteria need calibration, and implementation requires subsequent review.
