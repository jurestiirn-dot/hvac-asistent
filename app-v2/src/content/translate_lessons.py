#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to translate lesson content from Slovenian to English and Croatian
Uses deep-translator library with Google Translate
"""

import json
import time
from pathlib import Path
from deep_translator import GoogleTranslator

# Technical terms that should NOT be translated
TECHNICAL_TERMS = {
    'HEPA': 'HEPA',
    'ISO': 'ISO',
    'DPP': 'GMP',  # Dobra Proizvajalma Praksa -> Good Manufacturing Practice
    'GMP': 'GMP',
    'HVAC': 'HVAC',
    'ALCOA': 'ALCOA',
    'CAPA': 'CAPA',
    'CCS': 'CCS',
    'WFI': 'WFI',
    'PW': 'PW',
    'CFU': 'CFU',
    'LAL': 'LAL',
    'TOC': 'TOC',
    'RABS': 'RABS',
    'PAO': 'PAO',
    'BMS': 'BMS',
    'UPS': 'UPS',
    'ACH': 'ACH',
    'CFD': 'CFD',
    'UV': 'UV',
    'LED': 'LED',
    'IP65': 'IP65',
    'RO': 'RO',
    'EU': 'EU'
}

def translate_text(text, target_lang='en', chunk_size=3000):
    """
    Translate text in chunks to avoid API limits
    """
    if not text or len(text.strip()) == 0:
        return text
    
    # Split by paragraphs first
    paragraphs = text.split('\n\n')
    translated_paragraphs = []
    
    for para in paragraphs:
        if len(para.strip()) == 0:
            translated_paragraphs.append(para)
            continue
            
        # If paragraph is too long, split by sentences
        if len(para) > chunk_size:
            sentences = para.split('. ')
            current_chunk = []
            current_length = 0
            
            for sentence in sentences:
                if current_length + len(sentence) > chunk_size and current_chunk:
                    chunk_text = '. '.join(current_chunk) + '.'
                    try:
                        translator = GoogleTranslator(source='sl', target=target_lang)
                        translated = translator.translate(chunk_text)
                        translated_paragraphs.append(translated)
                        time.sleep(1.5)  # Longer delay to avoid rate limits
                    except Exception as e:
                        print(f"      Warning: {e}, using original text")
                        translated_paragraphs.append(chunk_text)
                        time.sleep(3)  # Even longer delay after error
                    
                    current_chunk = [sentence]
                    current_length = len(sentence)
                else:
                    current_chunk.append(sentence)
                    current_length += len(sentence)
            
            if current_chunk:
                chunk_text = '. '.join(current_chunk)
                try:
                    translator = GoogleTranslator(source='sl', target=target_lang)
                    translated = translator.translate(chunk_text)
                    translated_paragraphs.append(translated)
                    time.sleep(1.5)
                except Exception as e:
                    print(f"      Warning: {e}, using original text")
                    translated_paragraphs.append(chunk_text)
                    time.sleep(3)
        else:
            # Paragraph is short enough, translate directly
            try:
                translator = GoogleTranslator(source='sl', target=target_lang)
                translated = translator.translate(para)
                translated_paragraphs.append(translated)
                time.sleep(1)
            except Exception as e:
                print(f"      Warning: {e}, using original text")
                translated_paragraphs.append(para)
                time.sleep(3)
    
    return '\n\n'.join(translated_paragraphs)

def translate_lesson(lesson, target_lang='en'):
    """
    Translate a single lesson
    """
    print(f"  Translating lesson {lesson['id']}: {lesson['title'][:50]}...")
    
    translated = lesson.copy()
    
    # Translate title
    try:
        translated['title'] = translate_text(lesson['title'], target_lang)
        time.sleep(0.3)
    except Exception as e:
        print(f"    Error translating title: {e}")
    
    # Translate annexReference
    if lesson.get('annexReference'):
        try:
            translated['annexReference'] = translate_text(lesson['annexReference'], target_lang)
            time.sleep(0.3)
        except Exception as e:
            print(f"    Error translating annexReference: {e}")
    
    # Translate main content fields
    content_fields = ['developmentAndExplanation', 'practicalChallenges', 'improvementIdeas']
    for field in content_fields:
        if lesson.get(field):
            print(f"    Translating {field}...")
            try:
                translated[field] = translate_text(lesson[field], target_lang)
                time.sleep(0.5)
            except Exception as e:
                print(f"    Error translating {field}: {e}")
    
    # Translate quiz questions
    if lesson.get('quizQuestions'):
        print(f"    Translating {len(lesson['quizQuestions'])} quiz questions...")
        translated['quizQuestions'] = []
        
        for i, q in enumerate(lesson['quizQuestions']):
            translated_q = q.copy()
            
            try:
                # Translate question
                translated_q['question'] = translate_text(q['question'], target_lang)
                time.sleep(0.3)
                
                # Translate options
                translated_q['options'] = [
                    translate_text(opt, target_lang) for opt in q['options']
                ]
                time.sleep(0.3)
                
                # Translate explanation
                if q.get('explanation'):
                    translated_q['explanation'] = translate_text(q['explanation'], target_lang)
                    time.sleep(0.3)
                
                # Translate hint
                if q.get('hint'):
                    translated_q['hint'] = translate_text(q['hint'], target_lang)
                    time.sleep(0.3)
                
            except Exception as e:
                print(f"      Error translating question {i+1}: {e}")
            
            translated['quizQuestions'].append(translated_q)
    
    return translated

def translate_file(input_file, output_file, target_lang='en'):
    """
    Translate an entire lesson file
    """
    print(f"\nTranslating {input_file} to {target_lang.upper()}...")
    print(f"Output: {output_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lessons = json.load(f)
    
    translated_lessons = []
    
    for i, lesson in enumerate(lessons):
        print(f"\n[{i+1}/{len(lessons)}]")
        translated = translate_lesson(lesson, target_lang)
        translated_lessons.append(translated)
        
        # Save progress periodically
        if (i + 1) % 5 == 0:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(translated_lessons, f, ensure_ascii=False, indent=2)
            print(f"\n  Progress saved ({i+1}/{len(lessons)} lessons)")
    
    # Final save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(translated_lessons, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Translation complete! Saved to {output_file}")

def main():
    base_path = Path(__file__).parent
    
    # Translate main lessons to English
    translate_file(
        base_path / 'annex1-sl.json',
        base_path / 'annex1-en.json',
        'en'
    )
    
    # Translate advanced lessons to English
    translate_file(
        base_path / 'annex1-advanced-sl.json',
        base_path / 'annex1-advanced-en.json',
        'en'
    )
    
    # Translate main lessons to Croatian
    translate_file(
        base_path / 'annex1-sl.json',
        base_path / 'annex1-hr.json',
        'hr'
    )
    
    # Translate advanced lessons to Croatian
    translate_file(
        base_path / 'annex1-advanced-sl.json',
        base_path / 'annex1-advanced-hr.json',
        'hr'
    )
    
    print("\n" + "="*60)
    print("ALL TRANSLATIONS COMPLETE!")
    print("="*60)

if __name__ == '__main__':
    main()
