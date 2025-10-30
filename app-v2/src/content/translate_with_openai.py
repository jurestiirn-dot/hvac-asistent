#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to translate lesson content using OpenAI GPT-4
Better for technical/medical terminology and long texts
"""

import json
import time
from pathlib import Path
from openai import OpenAI

# Initialize OpenAI client - You need to set OPENAI_API_KEY environment variable
# or replace 'your-api-key-here' with your actual API key
try:
    client = OpenAI()  # Uses OPENAI_API_KEY from environment
except:
    print("ERROR: OpenAI API key not found!")
    print("Please set OPENAI_API_KEY environment variable or edit this script.")
    print("\nExample (PowerShell):")
    print('$env:OPENAI_API_KEY="sk-your-key-here"')
    exit(1)

# System prompts for translation
SYSTEM_PROMPT_EN = """You are a professional translator specializing in pharmaceutical and GMP (Good Manufacturing Practice) documentation. 
Translate the following Slovenian text to English, maintaining:
- Technical terminology accuracy (HEPA, ISO, GMP, HVAC, etc.)
- Formal, professional tone
- Markdown formatting
- Bullet points and numbered lists
- All technical specifications and numbers exactly as written

Do NOT translate technical acronyms like HEPA, ISO, GMP, HVAC, ACH, CFU, WFI, RABS, etc.
Translate "DPP" as "GMP" and "Dodatek 1" as "Annex 1"."""

SYSTEM_PROMPT_HR = """You are a professional translator specializing in pharmaceutical and GMP (Good Manufacturing Practice) documentation.
Translate the following Slovenian text to Croatian, maintaining:
- Technical terminology accuracy (HEPA, ISO, GMP, HVAC, etc.)
- Formal, professional tone
- Markdown formatting
- Bullet points and numbered lists
- All technical specifications and numbers exactly as written

Do NOT translate technical acronyms. Keep HEPA, ISO, GMP, HVAC, ACH, CFU, WFI, RABS, etc. as-is.
Translate "DPP" as "GMP" and "Dodatek 1" as "Prilog 1"."""

def translate_with_gpt(text, target_lang='en', max_retries=3):
    """
    Translate text using GPT-4
    """
    if not text or len(text.strip()) == 0:
        return text
    
    system_prompt = SYSTEM_PROMPT_EN if target_lang == 'en' else SYSTEM_PROMPT_HR
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using mini for cost efficiency, can change to gpt-4o for better quality
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Translate this text:\n\n{text}"}
                ],
                temperature=0.3,  # Lower temperature for more consistent translations
                max_tokens=4000
            )
            
            translated = response.choices[0].message.content
            return translated
            
        except Exception as e:
            print(f"      Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                print(f"      Failed after {max_retries} attempts, returning original text")
                return text
    
    return text

def translate_quiz_question(question, target_lang='en'):
    """
    Translate a single quiz question with all its components
    """
    translated = question.copy()
    
    try:
        # Translate question
        print(f"        - Question...")
        translated['question'] = translate_with_gpt(question['question'], target_lang)
        time.sleep(0.5)
        
        # Translate options (all at once to maintain consistency)
        print(f"        - Options...")
        options_text = "\n".join([f"{i+1}. {opt}" for i, opt in enumerate(question['options'])])
        translated_options = translate_with_gpt(options_text, target_lang)
        translated['options'] = [line.split('. ', 1)[1] if '. ' in line else line 
                                 for line in translated_options.split('\n') if line.strip()]
        time.sleep(0.5)
        
        # Translate explanation
        if question.get('explanation'):
            print(f"        - Explanation...")
            translated['explanation'] = translate_with_gpt(question['explanation'], target_lang)
            time.sleep(0.5)
        
        # Translate hint
        if question.get('hint'):
            print(f"        - Hint...")
            translated['hint'] = translate_with_gpt(question['hint'], target_lang)
            time.sleep(0.5)
        
    except Exception as e:
        print(f"        Error: {e}")
    
    return translated

def translate_lesson(lesson, target_lang='en', lesson_num=1, total=1):
    """
    Translate a single lesson
    """
    print(f"\n{'='*60}")
    print(f"[{lesson_num}/{total}] Lesson {lesson['id']}: {lesson['title'][:50]}...")
    print(f"{'='*60}")
    
    translated = lesson.copy()
    
    # Translate title
    print("  ✓ Title...")
    translated['title'] = translate_with_gpt(lesson['title'], target_lang)
    time.sleep(0.5)
    
    # Translate slug (keep it URL-friendly)
    # Don't translate slug - keep it same for routing
    
    # Translate annexReference
    if lesson.get('annexReference'):
        print("  ✓ Annex Reference...")
        translated['annexReference'] = translate_with_gpt(lesson['annexReference'], target_lang)
        time.sleep(0.5)
    
    # Translate main content fields
    content_fields = [
        ('developmentAndExplanation', 'Development & Explanation'),
        ('practicalChallenges', 'Practical Challenges'),
        ('improvementIdeas', 'Improvement Ideas')
    ]
    
    for field, display_name in content_fields:
        if lesson.get(field):
            print(f"  ✓ {display_name}...")
            # Split very long texts into chunks
            text = lesson[field]
            if len(text) > 8000:
                # Split by double newlines (paragraphs)
                paragraphs = text.split('\n\n')
                translated_paragraphs = []
                
                current_chunk = []
                current_length = 0
                
                for para in paragraphs:
                    if current_length + len(para) > 7000 and current_chunk:
                        chunk_text = '\n\n'.join(current_chunk)
                        translated_chunk = translate_with_gpt(chunk_text, target_lang)
                        translated_paragraphs.append(translated_chunk)
                        time.sleep(1)
                        current_chunk = [para]
                        current_length = len(para)
                    else:
                        current_chunk.append(para)
                        current_length += len(para)
                
                if current_chunk:
                    chunk_text = '\n\n'.join(current_chunk)
                    translated_chunk = translate_with_gpt(chunk_text, target_lang)
                    translated_paragraphs.append(translated_chunk)
                
                translated[field] = '\n\n'.join(translated_paragraphs)
            else:
                translated[field] = translate_with_gpt(text, target_lang)
            
            time.sleep(0.5)
    
    # Translate quiz questions
    if lesson.get('quizQuestions'):
        num_questions = len(lesson['quizQuestions'])
        print(f"  ✓ Quiz Questions ({num_questions} questions)...")
        translated['quizQuestions'] = []
        
        for i, q in enumerate(lesson['quizQuestions'], 1):
            print(f"      Question {i}/{num_questions}")
            translated_q = translate_quiz_question(q, target_lang)
            translated['quizQuestions'].append(translated_q)
    
    print(f"  ✅ Lesson {lesson['id']} complete!")
    return translated

def translate_file(input_file, output_file, target_lang='en'):
    """
    Translate an entire lesson file
    """
    lang_name = "English" if target_lang == 'en' else "Croatian"
    print(f"\n{'#'*70}")
    print(f"# TRANSLATING TO {lang_name.upper()}")
    print(f"# Input:  {input_file.name}")
    print(f"# Output: {output_file.name}")
    print(f"{'#'*70}\n")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lessons = json.load(f)
    
    total_lessons = len(lessons)
    translated_lessons = []
    
    # Load existing progress if any
    if output_file.exists():
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                if existing:
                    translated_lessons = existing
                    print(f"ℹ Resuming from lesson {len(existing) + 1}")
        except:
            pass
    
    start_from = len(translated_lessons)
    
    for i, lesson in enumerate(lessons[start_from:], start=start_from):
        translated = translate_lesson(lesson, target_lang, i + 1, total_lessons)
        translated_lessons.append(translated)
        
        # Save progress after each lesson
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(translated_lessons, f, ensure_ascii=False, indent=2)
        
        print(f"\n  💾 Progress saved: {len(translated_lessons)}/{total_lessons} lessons")
        
        # Longer pause between lessons to avoid rate limits
        if i < len(lessons) - 1:
            time.sleep(2)
    
    print(f"\n{'='*70}")
    print(f"✅ COMPLETE! Translated {len(translated_lessons)} lessons")
    print(f"   Saved to: {output_file}")
    print(f"{'='*70}\n")

def main():
    base_path = Path(__file__).parent
    
    print("\n" + "="*70)
    print("HVAC ASSISTANT - LESSON TRANSLATION TOOL")
    print("Using OpenAI GPT-4o-mini for pharmaceutical content translation")
    print("="*70 + "\n")
    
    # Ask user what to translate
    print("Select translation task:")
    print("1. Translate main lessons to English (annex1-sl.json → annex1-en.json)")
    print("2. Translate advanced lessons to English (annex1-advanced-sl.json → annex1-advanced-en.json)")
    print("3. Translate main lessons to Croatian (annex1-sl.json → annex1-hr.json)")
    print("4. Translate advanced lessons to Croatian (annex1-advanced-sl.json → annex1-advanced-hr.json)")
    print("5. Translate ALL to English (both files)")
    print("6. Translate ALL to Croatian (both files)")
    print("7. Translate EVERYTHING (all files, both languages)")
    
    choice = input("\nEnter choice (1-7): ").strip()
    
    tasks = []
    
    if choice == '1':
        tasks = [('annex1-sl.json', 'annex1-en.json', 'en')]
    elif choice == '2':
        tasks = [('annex1-advanced-sl.json', 'annex1-advanced-en.json', 'en')]
    elif choice == '3':
        tasks = [('annex1-sl.json', 'annex1-hr.json', 'hr')]
    elif choice == '4':
        tasks = [('annex1-advanced-sl.json', 'annex1-advanced-hr.json', 'hr')]
    elif choice == '5':
        tasks = [
            ('annex1-sl.json', 'annex1-en.json', 'en'),
            ('annex1-advanced-sl.json', 'annex1-advanced-en.json', 'en')
        ]
    elif choice == '6':
        tasks = [
            ('annex1-sl.json', 'annex1-hr.json', 'hr'),
            ('annex1-advanced-sl.json', 'annex1-advanced-hr.json', 'hr')
        ]
    elif choice == '7':
        tasks = [
            ('annex1-sl.json', 'annex1-en.json', 'en'),
            ('annex1-advanced-sl.json', 'annex1-advanced-en.json', 'en'),
            ('annex1-sl.json', 'annex1-hr.json', 'hr'),
            ('annex1-advanced-sl.json', 'annex1-advanced-hr.json', 'hr')
        ]
    else:
        print("Invalid choice!")
        return
    
    print(f"\n{'='*70}")
    print(f"Will translate {len(tasks)} file(s)")
    print(f"{'='*70}\n")
    
    input("Press Enter to start translation...")
    
    start_time = time.time()
    
    for i, (input_name, output_name, lang) in enumerate(tasks, 1):
        print(f"\n\n{'#'*70}")
        print(f"# TASK {i}/{len(tasks)}")
        print(f"{'#'*70}\n")
        
        translate_file(
            base_path / input_name,
            base_path / output_name,
            lang
        )
        
        if i < len(tasks):
            print("\n⏸ Waiting 5 seconds before next file...")
            time.sleep(5)
    
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    
    print("\n" + "="*70)
    print("🎉 ALL TRANSLATIONS COMPLETE! 🎉")
    print(f"   Total time: {minutes}m {seconds}s")
    print("="*70 + "\n")

if __name__ == '__main__':
    main()
