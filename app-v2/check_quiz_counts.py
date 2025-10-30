import json
import os
from pathlib import Path

def count_quiz_questions(file_path):
    """Count quiz questions in a lesson file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Handle both single lesson and array of lessons
        if isinstance(data, list):
            results = []
            for lesson in data:
                count = len(lesson.get('quizQuestions', []))
                results.append({
                    'id': lesson.get('id', 'unknown'),
                    'title': lesson.get('title', 'Unknown')[:50],
                    'count': count
                })
            return results
        else:
            count = len(data.get('quizQuestions', []))
            return [{
                'id': data.get('id', 'unknown'),
                'title': data.get('title', 'Unknown')[:50],
                'count': count
            }]
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []

# Find all JSON files in content directory
content_dir = Path(__file__).parent / 'src' / 'content'
json_files = list(content_dir.glob('*.json'))

print("=" * 80)
print("QUIZ QUESTION COUNT REPORT")
print("=" * 80)
print()

all_results = []
total_lessons = 0
lessons_under_10 = 0

for json_file in sorted(json_files):
    # Skip backup files
    if 'backup' in json_file.name.lower():
        continue
        
    print(f"\n📄 {json_file.name}")
    print("-" * 80)
    
    results = count_quiz_questions(json_file)
    
    for result in results:
        total_lessons += 1
        status = "✅" if result['count'] >= 10 else "⚠️"
        if result['count'] < 10:
            lessons_under_10 += 1
            
        print(f"{status} Lesson {result['id']}: {result['title']} - {result['count']} questions")
        all_results.append({
            'file': json_file.name,
            **result
        })

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total lessons checked: {total_lessons}")
print(f"Lessons with ≥10 questions: {total_lessons - lessons_under_10} ✅")
print(f"Lessons with <10 questions: {lessons_under_10} ⚠️")
print()

if lessons_under_10 > 0:
    print("LESSONS NEEDING MORE QUESTIONS:")
    print("-" * 80)
    for result in sorted(all_results, key=lambda x: x['count']):
        if result['count'] < 10:
            needed = 10 - result['count']
            print(f"  • Lesson {result['id']} ({result['file']}): {result['count']}/10 - Need {needed} more")
