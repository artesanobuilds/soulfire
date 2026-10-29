# Verification - 29 October 2026

- 16-page PDF rendered with Poppler; every page visually reviewed, with final hybrid and interaction diagrams separately inspected at readable resolution.
- PDF text extraction: 24,000+ characters, no replacement glyph; 16 link annotations; fixed-page renderer fails on text overflow or an undersized diagram.
- Five editable SVG diagrams with rendered PNG previews; self-contained editable HTML contains the same narrative.
- All archived payload byte counts and SHA256 values checked against their manifests. Prior research files were copied without edits; unavailable originals/images and never-performed experiments are explicitly identified.
- Source and evidence baseline is published Music Lab commit 8060fc8e42549b4d07ac8522d5dd3a2d3e94161c. App source and runtime were not changed or restarted. No new code test run is necessary for this documentation-only change; historical test evidence is labeled as such.
- Library batch upload of the PDF and HTML failed before preparation/finalization: the current supported upload helper could not resolve its hosted tool endpoint (DNS). One network-enabled retry failed at TLS discovery, also before any upload began. Neither artifact was confirmed saved to Library. Local files remain the deliverables; no alternate storage route was attempted.

- IsoTune byte identity independently confirmed: the research worker materialized original SHA256 equals `7e1054a76dd41eaa20912869e12f6cdd493131553cc7dc183c375fbc12c47785`, matching the local 50,551-byte archive. Page 14 and the source manifest now reflect this verification.

## Upload diagnosis and final state

The default Python 3.14 runtime has no existing default CA file/directory and fails certificate validation with `unable to get local issuer certificate`. The already-installed Python 3.12 document runtime uses `/private/etc/ssl/cert.pem` and successfully validates TLS 1.3 for both OpenAI hosts. No certificate, trust setting or validation flag was changed.

A retry of the same prepared batch flow using that existing trusted runtime was rejected by automatic approval review **before execution**. Stated reason: private design/research artifact disclosure to Library lacks explicit trusted authorization for that payload and destination. No artifacts were uploaded or partially prepared by these attempts. Upload is now **denied**, pending explicit approval; no alternate route attempted. Full self-contained HTML is available through the local task output for the parent review fallback.
