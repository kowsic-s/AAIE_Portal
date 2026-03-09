"""Registry module — re-exports ModelRegistry from engine for convenience."""
from app.ml.engine import ModelRegistry, get_engine

__all__ = ["ModelRegistry", "get_engine"]
