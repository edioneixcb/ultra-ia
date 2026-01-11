# Meta-Validação da Auditoria

{
  "valid": false,
  "checklist": {
    "completeness": {
      "passed": false,
      "issues": [
        {
          "type": "incomplete_checkpoints",
          "description": "0/22 checkpoints executados",
          "missing": [
            "CP-INTEGRATION-001",
            "CP-BASELINE-001",
            "CP-TARGETS-001",
            "CP-PREVENTIVE-001",
            "CP-ANTICIPATION-001",
            "CP-REQ-001",
            "CP-CFG-001",
            "CP-SEC-001",
            "CP-DEP-001",
            "CP-BLD-001",
            "CP-RTM-001",
            "CP-SYN-001",
            "CP-WEB-001",
            "CP-UX-001",
            "CP-DES-001",
            "CP-VER-001",
            "CP-FLX-001",
            "CP-CON-001",
            "CP-SCORE-001",
            "CP-COVERAGE-001",
            "CP-FORENSIC-001",
            "CP-MULTILAYER-001"
          ]
        }
      ]
    },
    "naValidity": {
      "passed": true,
      "issues": []
    },
    "consistency": {
      "passed": true,
      "issues": []
    },
    "traceability": {
      "passed": false,
      "issues": [
        {
          "type": "missing_traceability_matrix",
          "description": "Matriz de rastreabilidade não encontrada"
        }
      ]
    },
    "coverage": {
      "passed": false,
      "issues": [
        {
          "type": "missing_coverage",
          "description": "Informações de cobertura não encontradas"
        }
      ]
    },
    "roadmapQuality": {
      "passed": false,
      "issues": [
        {
          "type": "invalid_roadmap_format",
          "description": "Roadmap não tem formato válido (faltando phases)"
        }
      ]
    }
  },
  "auditOfAudit": {
    "checkpointsExecuted": false,
    "checksExecuted": true,
    "naJustified": true,
    "evidenceLevels": false,
    "microCheckpoints": true,
    "threeERule": true
  },
  "score": 33
}