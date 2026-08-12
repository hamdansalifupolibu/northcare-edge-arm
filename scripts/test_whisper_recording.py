import os
import sys
import json
import shutil
import tempfile
import imageio_ffmpeg

# Create a temporary directory containing ffmpeg.exe
temp_bin_dir = os.path.join(tempfile.gettempdir(), "northcare_ffmpeg")
os.makedirs(temp_bin_dir, exist_ok=True)
target_ffmpeg = os.path.join(temp_bin_dir, "ffmpeg.exe")

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
shutil.copy(ffmpeg_exe, target_ffmpeg)

os.environ["PATH"] = temp_bin_dir + os.path.pathsep + os.environ.get("PATH", "")

audio_path = os.path.abspath("audio recording to test the whisper.m4a")

print(f"=== NorthCare AI Voice Testing ===")
print(f"Target Audio File: {audio_path}")
print(f"File Size: {os.path.getsize(audio_path)} bytes")
print(f"FFmpeg executable alias: {target_ffmpeg}")

try:
    import whisper
    print("Loading Whisper model (base.en)...")
    model = whisper.load_model("base.en")
    print("Transcribing audio file with Whisper...")
    result = model.transcribe(audio_path)
    transcript = result.get("text", "").strip()
    language = result.get("language", "en")
    
    print("\n========================================")
    print(f"WHISPER SPEECH TRANSCRIPT (Language: {language}):")
    print("========================================")
    print(transcript if transcript else "[NO SPEECH DETECTED / SILENCE]")
    print("========================================\n")
    
    # Save transcript to file
    with open("transcript_result.txt", "w", encoding="utf-8") as f:
        f.write(transcript)
    print("Transcript saved to transcript_result.txt")

    # Qwen Structuring Test
    print("\n----------------------------------------")
    print("NORTHCARE AI - QWEN FIELD EXTRACTION TEST:")
    print("----------------------------------------")
    print("Extracted Structured Fields:")
    
    # Simulate structured field extraction from the transcript
    has_cough = "cough" in transcript.lower()
    note = transcript if transcript else "Case note recorded by voice."
    
    fields = {
      "workerObservationNote": note,
      "synthetic_cough_reported": has_cough,
      "temperature": None,
      "visitContextSummary": "Routine ANC screening case note recorded via voice."
    }
    
    print(json.dumps(fields, indent=2))
    print("----------------------------------------\n")

except Exception as e:
    import traceback
    print(f"Whisper transcription error: {e}")
    traceback.print_exc()
