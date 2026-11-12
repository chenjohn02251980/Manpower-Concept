# Parse the SMT APS Schedule from user input
import csv
import json

raw_csv = """Process,Line,Device,DType,Model,PlanDate,PlanQty,Output,DPSQty,Balance,ParentPart,Plant,Family,Side,Board,Panel,CT,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,P,S,E,R,summary"""
