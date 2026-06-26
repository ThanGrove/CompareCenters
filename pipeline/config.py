"""Shared config, loaded from the JSON files both the pipeline and the dashboard
read (config/*.json) so dimensions aren't defined twice."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_CONFIG = ROOT / "config"

DIMENSIONS: list[dict] = json.loads((_CONFIG / "dimensions.json").read_text())
CENTERS: list[dict] = json.loads((_CONFIG / "centers.json").read_text())

DIMENSION_IDS: list[str] = [d["id"] for d in DIMENSIONS]

# Where raw crawled HTML is saved (data/crawl/<crawlId>/<hash>.html).
CRAWL_DIR = ROOT / "data" / "crawl"
