"""Conservative endpoint-to-marker geometry checks for source audits."""
from __future__ import annotations
import math

class UnsupportedMarkerGeometry(ValueError):
    """The source does not provide a usable local ellipse and affine transform."""

def point_inside_marker_ellipse(point: dict, marker: dict, epsilon: float = 1e-12) -> bool:
    """Invert the source affine transform; world bounding boxes are not ellipses.

    Callers must already have identified the source shape as an ellipse marker.
    Missing/singular transforms are unsupported, never a genuine outside result.
    """
    geometry = marker.get("geometry") or {}
    bounds = geometry.get("local_bounds") or {}
    matrix = geometry.get("local_to_page")
    if not isinstance(matrix, (list, tuple)) or len(matrix) != 6:
        raise UnsupportedMarkerGeometry("Positive local ellipse bounds and six affine coefficients required")
    try:
        width, height = float(bounds.get("width") or 0), float(bounds.get("height") or 0)
        min_x, min_y = float(bounds.get("min_x", 0)), float(bounds.get("min_y", 0))
        a, b, c, d, e, f = map(float, matrix)
        point_x, point_y = float(point["x"]), float(point["y"])
    except (ValueError, TypeError, KeyError) as error:
        raise UnsupportedMarkerGeometry("Invalid ellipse/point coefficients") from error
    if width <= 0 or height <= 0:
        raise UnsupportedMarkerGeometry("Positive local ellipse dimensions required")
    values = [a, b, c, d, e, f, width, height, min_x, min_y, point_x, point_y, epsilon]
    if not all(math.isfinite(value) for value in values):
        raise UnsupportedMarkerGeometry("Non-finite geometry")
    determinant = a * d - b * c
    scale = max(abs(a), abs(b), abs(c), abs(d))
    if scale == 0 or abs(determinant) <= 1e-12 * scale * scale:
        raise UnsupportedMarkerGeometry("Singular or unstable affine transform")
    px, py = point_x - e, point_y - f
    local_x = (d * px - c * py) / determinant
    local_y = (-b * px + a * py) / determinant
    center_x = min_x + width / 2
    center_y = min_y + height / 2
    dx = (local_x - center_x) / (width / 2)
    dy = (local_y - center_y) / (height / 2)
    return dx * dx + dy * dy <= 1 + epsilon

def matching_marker_shapes(point: dict, markers: list[dict]) -> list[dict]:
    """Return every hit; unsupported geometry raises rather than becoming no-hit."""
    return [marker for marker in markers if point_inside_marker_ellipse(point, marker)]
