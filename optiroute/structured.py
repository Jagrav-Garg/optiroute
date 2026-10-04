"""Keep provider tool schemas explicit while preserving strict host validation."""
import json

import jsonref
from partial_json_parser import loads as partial_loads


def tool_schema(model):
    schema = jsonref.replace_refs(model.model_json_schema(), proxies=False)
    schema.pop("$defs", None)
    return schema


def normalize_containers(value, schema, partial=False):
    alternatives = schema.get("anyOf", [schema])
    container = next((option for option in alternatives if option.get("type") in {"object", "array"}), None)
    if not container:
        return value
    # Some small models JSON-encode object/array parameters. Decode only where
    # the declared schema requires a container; ordinary text is never coerced.
    if isinstance(value, str):
        try:
            decoded = partial_loads(value) if partial else json.loads(value)
        except (ValueError, TypeError):
            return value
        if isinstance(decoded, dict) and container["type"] == "object" or isinstance(decoded, list) and container["type"] == "array":
            value = decoded
    if container["type"] == "object" and isinstance(value, dict):
        properties = container.get("properties", {})
        return {key: normalize_containers(child, properties.get(key, {}), partial) for key, child in value.items()}
    if container["type"] == "array" and isinstance(value, list):
        return [normalize_containers(child, container.get("items", {}), partial) for child in value]
    return value
