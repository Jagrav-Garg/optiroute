import json

import pytest
from pydantic import ValidationError

from optiroute.models import Clarification, Research
from optiroute.structured import normalize_containers, tool_schema


def test_inline_schema_and_encoded_nested_values_preserve_strict_validation():
    schema = tool_schema(Clarification)
    assert "$ref" not in json.dumps(schema) and "$defs" not in schema
    assert schema["properties"]["brief"]["type"] == "object"
    encoded = {"brief": json.dumps({"destination": "Switzerland", "interests": json.dumps(["lakes"])}), "questions": "[]"}
    result = Clarification.model_validate(normalize_containers(encoded, schema))
    assert result.brief.destination == "Switzerland" and result.brief.interests == ["lakes"]
    with pytest.raises(ValidationError):
        Clarification.model_validate(normalize_containers({"brief": '{"destination":"Switzerland","invented":true}'}, schema))


def test_partial_containers_and_plain_strings_are_not_mistaken_for_data():
    schema = tool_schema(Research)
    partial = normalize_containers({"summary": '{"keep":"as text"}', "recommendations": '[{"name":"Lucerne'}, schema, partial=True)
    assert partial["summary"] == '{"keep":"as text"}'
    assert partial["recommendations"] == [{"name": "Lucerne"}]
    invalid = normalize_containers({"recommendations": "not JSON"}, schema)
    with pytest.raises(ValidationError):
        Research.model_validate(invalid)
