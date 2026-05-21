import csv
import json
import os

# 스크립트 파일이 위치한 디렉토리 기준 상대 경로 설정
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.abspath(os.path.join(script_dir, "../../메디컬 스탬프 병원 지도 - Hospitals.csv"))
json_path = os.path.abspath(os.path.join(script_dir, "../data/hospitals.json"))


hospitals = []

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Normalize status typos, e.g., 'inavtive' -> 'inactive'
        status = row.get('status', 'active').strip()
        if status == 'inavtive':
            status = 'inactive'
            
        tags_raw = row.get('tags', '').strip()
        tags = [t.strip() for t in tags_raw.split(',') if t.strip()] if tags_raw else []
        
        hospital = {
            "id": row.get('id', '').strip(),
            "name": row.get('name', '').strip(),
            "address": row.get('address', '').strip(),
            "tel": row.get('tel', '').strip(),
            "lat": float(row.get('lat', 0)) if row.get('lat') else 0.0,
            "lng": float(row.get('lng', 0)) if row.get('lng') else 0.0,
            "fee": row.get('fee', '').strip(),
            "tips": row.get('tips', '').strip(),
            "tags": tags,
            "lastUpdated": row.get('lastUpdated', '').strip(),
            "status": status,
            "kakaoPlaceId": row.get('kakaoPlaceId', '').strip(),
            "naverPlaceId": row.get('naverPlaceId', '').strip(),
            "reviews": []  # Empty reviews array as default
        }
        hospitals.append(hospital)

with open(json_path, mode='w', encoding='utf-8') as f:
    json.dump(hospitals, f, ensure_ascii=False, indent=2)

print(f"Successfully converted {len(hospitals)} hospitals to JSON.")
