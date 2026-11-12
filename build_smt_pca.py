import json
import re

# Read data rows from raw file or script
# SMT lines: S21, S22, S23, S41, S42, S43, S44, S51, S61, S71, S72, S73
# Paired PCA lines: P21, P22, P23, P41, P42, P43, P44, P51, P61, P71, P72, P73

LINE_CONFIGS = {
    "S21": {"pairedPca": "P21", "smtStdDL": 6, "pcaStdDL": 18, "plant": "TP05"},
    "S22": {"pairedPca": "P22", "smtStdDL": 6, "pcaStdDL": 18, "plant": "TP05"},
    "S23": {"pairedPca": "P23", "smtStdDL": 5, "pcaStdDL": 16, "plant": "TP05"},
    "S41": {"pairedPca": "P41", "smtStdDL": 6, "pcaStdDL": 18, "plant": "TP05"},
    "S42": {"pairedPca": "P42", "smtStdDL": 6, "pcaStdDL": 16, "plant": "TP05"},
    "S43": {"pairedPca": "P43", "smtStdDL": 5, "pcaStdDL": 16, "plant": "TP05"},
    "S44": {"pairedPca": "P44", "smtStdDL": 6, "pcaStdDL": 18, "plant": "TP05"},
    "S51": {"pairedPca": "P51", "smtStdDL": 6, "pcaStdDL": 18, "plant": "TP05"},
    "S61": {"pairedPca": "P61", "smtStdDL": 5, "pcaStdDL": 16, "plant": "TP05"},
    "S71": {"pairedPca": "P71", "smtStdDL": 6, "pcaStdDL": 16, "plant": "TP05"},
    "S72": {"pairedPca": "P72", "smtStdDL": 5, "pcaStdDL": 14, "plant": "TP05"},
    "S73": {"pairedPca": "P73", "smtStdDL": 5, "pcaStdDL": 14, "plant": "TP05"},
}

print("Line configs ready")
