"""Complete the build-only eSpeak installation's omitted Faroese dictionary.

Downloads pinned GPL-3.0+ eSpeak NG source data into .local-data only. No runtime
app dependency or external service. Official source: github.com/espeak-ng/espeak-ng.
"""
import ctypes
import hashlib
from pathlib import Path
import urllib.request
import espeakng_loader

root = Path(__file__).resolve().parents[1]
folder = root / '.local-data/espeak-faroese'
folder.mkdir(parents=True, exist_ok=True)
expected = {'fo_rules': '2e9ff9652f775575cfd269f1813433972209b7cf656c3f4cdc4c3b61c3fb3672', 'fo_list': 'de9853520b06553a979edcbdc48fa480962a159463672b22fcc0cf159abee039'}
for filename, sha in expected.items():
    path = folder / filename
    if not path.exists():
        with urllib.request.urlopen(f'https://raw.githubusercontent.com/espeak-ng/espeak-ng/1.52.0/dictsource/{filename}', timeout=60) as response:
            data = response.read()
        assert hashlib.sha256(data).hexdigest() == sha, filename
        path.write_bytes(data)
    assert hashlib.sha256(path.read_bytes()).hexdigest() == sha, filename
lib = ctypes.CDLL(espeakng_loader.get_library_path())
lib.espeak_Initialize.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_int]
assert lib.espeak_Initialize(2, 0, espeakng_loader.get_data_path().encode(), 0x8000) > 0
lib.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
assert lib.espeak_SetVoiceByName(b'fo') == 0
lib.espeak_CompileDictionary.argtypes = [ctypes.c_char_p, ctypes.c_void_p, ctypes.c_int]
lib.espeak_CompileDictionary.restype = None
lib.espeak_CompileDictionary((str(folder) + '/').encode(), None, 0)
assert (Path(espeakng_loader.get_data_path()) / 'fo_dict').is_file()
