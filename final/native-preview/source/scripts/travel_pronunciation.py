"""Approximate Korean reading of place names, never a claim to official Korean names.

Hangulize language rules take precedence. eSpeak's IPA output supplies a fallback
for languages without Hangulize rules. Dependencies are build-only, not app code.
"""
from functools import lru_cache
import re
import unicodedata
from hangulize import hangulize
from phonemizer.backend import EspeakBackend
from phonemizer.backend.espeak.wrapper import EspeakWrapper
from phonemizer.separator import Separator
import espeakng_loader

EspeakWrapper.set_library(espeakng_loader.get_library_path())
EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
LANGUAGES = {
 'AD': ('cat','ca'), 'AL': ('sqi','sq'), 'AM': (None,'hy'), 'AT': ('deu','de'),
 'AX': ('swe','sv'), 'AZ': ('aze','az'), 'BA': ('hbs','bs'), 'BE': (None,'fr-be'),
 'BG': ('bul','bg'), 'BY': ('bel','be'), 'CH': ('deu','de'), 'CY': ('ell','el'),
 'CZ': ('ces','cs'), 'DE': ('deu','de'), 'DK': (None,'da'), 'EE': ('est','et'),
 'ES': ('spa','es'), 'FI': ('fin','fi'), 'FO': (None,'fo'), 'FR': (None,'fr-fr'),
 'GB': (None,'en-gb'), 'GE': ('kat','ka'), 'GG': (None,'en-gb'), 'GI': (None,'en-gb'),
 'GR': ('ell','el'), 'HR': ('hbs','hr'), 'HU': ('hun','hu'), 'IE': (None,'en-gb'),
 'IM': (None,'en-gb'), 'IS': ('isl','is'), 'IT': ('ita','it'), 'JE': (None,'fr-fr'),
 'KZ': (None,'kk'), 'LI': ('deu','de'), 'LT': ('lit','lt'), 'LU': (None,'lb'),
 'LV': ('lav','lv'), 'MC': (None,'fr-fr'), 'MD': ('ron','ro'), 'ME': ('hbs','sr'),
 'MK': ('mkd','mk'), 'MT': (None,'mt'), 'NL': ('nld','nl'), 'NO': (None,'nb'),
 'PL': ('pol','pl'), 'PT': ('por','pt'), 'RO': ('ron','ro'), 'RS': ('hbs','sr'),
 'RU': ('rus','ru'), 'SE': ('swe','sv'), 'SI': ('slv','sl'), 'SJ': (None,'nb'),
 'SK': ('slk','sk'), 'SM': ('ita','it'), 'TR': ('tur','tr'), 'UA': ('ukr','uk'),
 'VA': ('ita','it'), 'XK': ('sqi','sq'),
}
SCRIPTS = {'RU': r'[А-Яа-я]', 'BY': r'[А-Яа-яІі]', 'UA': r'[А-Яа-яІіЇїЄє]', 'BG': r'[А-Яа-я]', 'MK': r'[А-Яа-я]', 'GR': r'[\u0370-\u03ff]', 'CY': r'[\u0370-\u03ff]', 'GE': r'[\u10a0-\u10ff]', 'AM': r'[\u0530-\u058f]', 'KZ': r'[\u0400-\u052f]'}
CONSONANTS = {'p':17,'b':7,'t':16,'d':3,'k':15,'ɡ':0,'g':0,'f':17,'v':7,'s':9,'z':12,'ʃ':9,'ʒ':12,'tʃ':14,'dʒ':12,'ts':14,'dz':12,'ɕ':9,'ʑ':12,'x':18,'h':18,'χ':18,'θ':9,'ð':3,'ɣ':0,'q':15,'ɟ':12,'ɲ':2,'ŋ':11,'n':2,'m':6,'l':5,'r':5,'ʁ':5,'ɾ':5,'ɹ':5,'ʀ':5,'ʎ':5,'β':7,'ʋ':7,'ʝ':12,'c':15,'ʈ':16,'ɖ':3,'ɳ':2,'ɭ':5,'ɬ':5,'ʂ':9,'ʐ':12,'ɸ':17,'ɱ':6,'ɫ':5,'ʔ':11}
VOWELS = {'a':0,'ɑ':0,'ɐ':0,'æ':1,'ɛ':5,'e':5,'ə':4,'ɜ':4,'ɞ':4,'ʌ':4,'ɔ':8,'o':8,'ɒ':8,'u':13,'ʊ':13,'ɯ':18,'ɨ':18,'ɤ':18,'y':16,'ʏ':16,'ø':11,'œ':11,'i':20,'ɪ':20,'ɩ':20,'ɚ':4,'ɝ':4,'ᵻ':20,'ɘ':4,'ɵ':8,'ɶ':11}
Y_VOWELS = {0:2,1:3,4:6,5:7,8:12,13:17,20:20}
W_VOWELS = {0:9,1:10,4:14,5:15,8:14,13:13,20:16}

def compose(initial, vowel, final=0):
    return chr(0xac00 + initial * 588 + vowel * 28 + final)

def ipa_to_korean(ipa, language):
    """Small, deterministic IPA-to-Hangul approximation, preserving syllable boundaries."""
    words = []
    for word in ipa.split(' / '):
        phones = []
        for phone in word.split('|'):
            nasal = '\u0303' in unicodedata.normalize('NFD', phone)
            phone = re.sub(r'[ːˑˈˌʲʰʷ͜͡\u0300-\u036f]', '', phone)
            if phone in VOWELS or phone in CONSONANTS or phone in ('j','w'):
                phones.append(phone)
            else:
                # Diphthongs and syllabic consonants are expanded without losing phones.
                phones.extend(c for c in phone if c in VOWELS or c in CONSONANTS or c in ('j','w'))
            if nasal: phones.append('ŋ')
        out = []
        i = 0
        def vowel(phone):
            if phone == 'ə' and language.startswith('fr'): return 18
            if phone == 'a' and language.startswith('en'): return 1
            return VOWELS[phone]
        while i < len(phones):
            phone = phones[i]
            if phone in VOWELS:
                out.append(compose(11, vowel(phone))); i += 1; continue
            onset = CONSONANTS.get(phone, 11)
            next_i = i + 1
            glide = None
            if phone in ('j','w'): glide = phone
            elif next_i < len(phones) and phones[next_i] in ('j','w'):
                glide = phones[next_i]; next_i += 1
            if next_i < len(phones) and phones[next_i] in VOWELS:
                if phone in ('l', 'ɫ') and out and 0xac00 <= ord(out[-1]) <= 0xd7a3 and (ord(out[-1]) - 0xac00) % 28 == 0:
                    out[-1] = chr(ord(out[-1]) + 8)
                v = vowel(phones[next_i])
                if glide == 'j' or phone == 'ʃ': v = Y_VOWELS.get(v, v)
                if glide == 'w': v = W_VOWELS.get(v, v)
                out.append(compose(onset, v)); i = next_i + 1; continue
            final = {'n':4,'ɲ':4,'m':16,'ŋ':21,'l':8,'ɫ':8}.get(phone)
            if language.startswith('en') and phone in ('p','k'): final = {'p':17,'k':1}[phone]
            if final and out and 0xac00 <= ord(out[-1]) <= 0xd7a3 and (ord(out[-1]) - 0xac00) % 28 == 0:
                out[-1] = chr(ord(out[-1]) + final)
            else:
                v = 20 if phone in ('ʃ','ʒ','tʃ','dʒ','j') else 13 if phone == 'w' else 18
                out.append(compose(onset, v))
            i += 1
        words.append(''.join(out))
    return ' '.join(filter(None, words))

@lru_cache(maxsize=12)
def backend(language):
    return EspeakBackend(language, with_stress=False, language_switch='remove-flags')

def language_for(code, region=''):
    if code == 'BE' and ('플랑드르' in region or '플라망' in region or 'Flemish' in region): return 'nld','nl'
    if code == 'CH':
        if '티치노' in region: return 'ita','it'
        if any(r in region for r in ['제네바','보 주','발레','뇌샤텔','주라','쥐라','프리부르']): return None,'fr-ch'
    if code == 'GB' and region == 'Wales': return 'cym','cy'
    return LANGUAGES[code]

def source_spelling(code, name, search=''):
    script = SCRIPTS.get(code)
    if script and not re.search(script, name):
        for alternative in search.split(' | '):
            alternative = unicodedata.normalize('NFC', alternative)
            if re.search(script, alternative): return alternative
    return name

@lru_cache(maxsize=100000)
def transcribe(code, spelling, region=''):
    rule, language = language_for(code, region)
    if rule:
        result = hangulize(spelling, rule)
        if re.search('[가-힣]', result) and not re.search(r'[^가-힣\s\d\-.,()’\']', result):
            return result.strip(), 'hangulize:' + rule
    # For Romanized Slavic names, use spelling-based Roman rules rather than
    # asking a Cyrillic voice to pronounce a foreign alphabet as letter names.
    if code in SCRIPTS and not re.search(SCRIPTS[code], spelling):
        result = hangulize(spelling, 'hbs' if code in ('RU','UA','BY','BG','MK','KZ') else 'lat')
        if re.search('[가-힣]', result) and not re.search(r'[^가-힣\s\d\-.,()’\']', result): return result.strip(), 'romanized-fallback'
    ipa = backend(language).phonemize([spelling], separator=Separator(phone='|', word=' / '), strip=True)[0]
    result = ipa_to_korean(ipa, language)
    if not re.search('[가-힣]', result):
        result = hangulize(spelling, 'lat')
    # Fail visibly at build time instead of publishing empty or untranslated labels.
    if not re.search('[가-힣]', result) or re.search(r'[^가-힣\s\d\-.,()’\']', result):
        raise ValueError(f'Cannot transcribe {code}: {spelling!r} ({result!r})')
    return result.strip(), 'ipa:' + language
