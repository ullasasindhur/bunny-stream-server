import { got } from "got";
const url = 'https://video.bunnycdn.com/library';
const captionsList = [
    { "code": "aa", "name": "Afar" },
    { "code": "ab", "name": "Abkhazian" },
    { "code": "ae", "name": "Avestan" },
    { "code": "af", "name": "Afrikaans" },
    { "code": "ak", "name": "Akan" },
    { "code": "am", "name": "Amharic" },
    { "code": "an", "name": "Aragonese" },
    { "code": "ar", "name": "Arabic" },
    { "code": "as", "name": "Assamese" },
    { "code": "av", "name": "Avaric" },
    { "code": "ay", "name": "Aymara" },
    { "code": "az", "name": "Azerbaijani" },
    { "code": "ba", "name": "Bashkir" },
    { "code": "be", "name": "Belarusian" },
    { "code": "bg", "name": "Bulgarian" },
    { "code": "bh", "name": "Bihari" },
    { "code": "bi", "name": "Bislama" },
    { "code": "bm", "name": "Bambara" },
    { "code": "bn", "name": "Bengali" },
    { "code": "bo", "name": "Tibetan" },
    { "code": "br", "name": "Breton" },
    { "code": "bs", "name": "Bosnian" },
    { "code": "ca", "name": "Catalan" },
    { "code": "ce", "name": "Chechen" },
    { "code": "ch", "name": "Chamorro" },
    { "code": "co", "name": "Corsican" },
    { "code": "cr", "name": "Cree" },
    { "code": "cs", "name": "Czech" },
    { "code": "cu", "name": "Old Church Slavonic" },
    { "code": "cv", "name": "Chuvash" },
    { "code": "cy", "name": "Welsh" },
    { "code": "da", "name": "Danish" },
    { "code": "de", "name": "German" },
    { "code": "dv", "name": "Divehi" },
    { "code": "dz", "name": "Dzongkha" },
    { "code": "ee", "name": "Ewe" },
    { "code": "el", "name": "Greek" },
    { "code": "en", "name": "English" },
    { "code": "eo", "name": "Esperanto" },
    { "code": "es", "name": "Spanish" },
    { "code": "et", "name": "Estonian" },
    { "code": "eu", "name": "Basque" },
    { "code": "fa", "name": "Persian" },
    { "code": "ff", "name": "Fulah" },
    { "code": "fi", "name": "Finnish" },
    { "code": "fj", "name": "Fijian" },
    { "code": "fo", "name": "Faroese" },
    { "code": "fr", "name": "French" },
    { "code": "fy", "name": "Western Frisian" },
    { "code": "ga", "name": "Irish" },
    { "code": "gd", "name": "Scottish Gaelic" },
    { "code": "gl", "name": "Galician" },
    { "code": "gn", "name": "Guarani" },
    { "code": "gu", "name": "Gujarati" },
    { "code": "gv", "name": "Manx" },
    { "code": "ha", "name": "Hausa" },
    { "code": "he", "name": "Hebrew" },
    { "code": "hi", "name": "Hindi" },
    { "code": "ho", "name": "Hiri Motu" },
    { "code": "hr", "name": "Croatian" },
    { "code": "ht", "name": "Haitian Creole" },
    { "code": "hu", "name": "Hungarian" },
    { "code": "hy", "name": "Armenian" },
    { "code": "hz", "name": "Herero" },
    { "code": "ia", "name": "Interlingua" },
    { "code": "id", "name": "Indonesian" },
    { "code": "ie", "name": "Interlingue" },
    { "code": "ig", "name": "Igbo" },
    { "code": "ii", "name": "Sichuan Yi" },
    { "code": "ik", "name": "Inupiaq" },
    { "code": "io", "name": "Ido" },
    { "code": "is", "name": "Icelandic" },
    { "code": "it", "name": "Italian" },
    { "code": "iu", "name": "Inuktitut" },
    { "code": "ja", "name": "Japanese" },
    { "code": "jv", "name": "Javanese" },
    { "code": "ka", "name": "Georgian" },
    { "code": "kg", "name": "Kongo" },
    { "code": "ki", "name": "Kikuyu" },
    { "code": "kj", "name": "Kwanyama" },
    { "code": "kk", "name": "Kazakh" },
    { "code": "kl", "name": "Kalaallisut" },
    { "code": "km", "name": "Khmer" },
    { "code": "kn", "name": "Kannada" },
    { "code": "ko", "name": "Korean" },
    { "code": "kr", "name": "Kanuri" },
    { "code": "ks", "name": "Kashmiri" },
    { "code": "ku", "name": "Kurdish" },
    { "code": "kv", "name": "Komi" },
    { "code": "kw", "name": "Cornish" },
    { "code": "ky", "name": "Kirghiz" },
    { "code": "la", "name": "Latin" },
    { "code": "lb", "name": "Luxembourgish" },
    { "code": "lg", "name": "Ganda" },
    { "code": "li", "name": "Limburgan" },
    { "code": "ln", "name": "Lingala" },
    { "code": "lo", "name": "Lao" },
    { "code": "lt", "name": "Lithuanian" },
    { "code": "lu", "name": "Luba-Katanga" },
    { "code": "lv", "name": "Latvian" },
    { "code": "mg", "name": "Malagasy" },
    { "code": "mh", "name": "Marshallese" },
    { "code": "mi", "name": "Maori" },
    { "code": "mk", "name": "Macedonian" },
    { "code": "ml", "name": "Malayalam" },
    { "code": "mn", "name": "Mongolian" },
    { "code": "mr", "name": "Marathi" },
    { "code": "ms", "name": "Malay" },
    { "code": "mt", "name": "Maltese" },
    { "code": "my", "name": "Burmese" },
    { "code": "na", "name": "Nauru" },
    { "code": "nb", "name": "Norwegian Bokmål" },
    { "code": "nd", "name": "North Ndebele" },
    { "code": "ne", "name": "Nepali" },
    { "code": "ng", "name": "Ndonga" },
    { "code": "nl", "name": "Dutch" },
    { "code": "nn", "name": "Norwegian Nynorsk" },
    { "code": "no", "name": "Norwegian" },
    { "code": "nr", "name": "South Ndebele" },
    { "code": "nv", "name": "Navajo" },
    { "code": "ny", "name": "Chichewa" },
    { "code": "oc", "name": "Occitan" },
    { "code": "oj", "name": "Ojibwa" },
    { "code": "om", "name": "Oromo" },
    { "code": "or", "name": "Oriya" },
    { "code": "os", "name": "Ossetian" },
    { "code": "pa", "name": "Punjabi" },
    { "code": "pi", "name": "Pali" },
    { "code": "pl", "name": "Polish" },
    { "code": "ps", "name": "Pashto" },
    { "code": "pt", "name": "Portuguese" },
    { "code": "qu", "name": "Quechua" },
    { "code": "rm", "name": "Romansh" },
    { "code": "rn", "name": "Rundi" },
    { "code": "ro", "name": "Romanian" },
    { "code": "ru", "name": "Russian" },
    { "code": "rw", "name": "Kinyarwanda" },
    { "code": "sa", "name": "Sanskrit" },
    { "code": "sc", "name": "Sardinian" },
    { "code": "sd", "name": "Sindhi" },
    { "code": "se", "name": "Northern Sami" },
    { "code": "sg", "name": "Sango" },
    { "code": "si", "name": "Sinhala" },
    { "code": "sk", "name": "Slovak" },
    { "code": "sl", "name": "Slovenian" },
    { "code": "sm", "name": "Samoan" },
    { "code": "sn", "name": "Shona" },
    { "code": "so", "name": "Somali" },
    { "code": "sq", "name": "Albanian" },
    { "code": "sr", "name": "Serbian" },
    { "code": "ss", "name": "Swati" },
    { "code": "st", "name": "Southern Sotho" },
    { "code": "su", "name": "Sundanese" },
    { "code": "sv", "name": "Swedish" },
    { "code": "sw", "name": "Swahili" },
    { "code": "ta", "name": "Tamil" },
    { "code": "te", "name": "Telugu" },
    { "code": "tg", "name": "Tajik" },
    { "code": "th", "name": "Thai" },
    { "code": "ti", "name": "Tigrinya" },
    { "code": "tk", "name": "Turkmen" },
    { "code": "tl", "name": "Tagalog" },
    { "code": "tn", "name": "Tswana" },
    { "code": "to", "name": "Tongan" },
    { "code": "tr", "name": "Turkish" },
    { "code": "ts", "name": "Tsonga" },
    { "code": "tt", "name": "Tatar" },
    { "code": "tw", "name": "Twi" },
    { "code": "ty", "name": "Tahitian" },
    { "code": "ug", "name": "Uighur" },
    { "code": "uk", "name": "Ukrainian" },
    { "code": "ur", "name": "Urdu" },
    { "code": "uz", "name": "Uzbek" },
    { "code": "ve", "name": "Venda" },
    { "code": "vi", "name": "Vietnamese" },
    { "code": "vo", "name": "Volapük" },
    { "code": "wa", "name": "Walloon" },
    { "code": "wo", "name": "Wolof" },
    { "code": "xh", "name": "Xhosa" },
    { "code": "yi", "name": "Yiddish" },
    { "code": "yo", "name": "Yoruba" },
    { "code": "za", "name": "Zhuang" },
    { "code": "zh", "name": "Chinese" },
    { "code": "zu", "name": "Zulu" }
]

const getVideos = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.LIBRARY_API_KEY },
            searchParams: {
                page: req.query.page || 1,
                itemsPerPage: req.query.itemsPerPage || 10,
                search: req.query.search || '',
                collection: req.query.collection || '',
                orderBy: req.query.orderBy || 'date'
            }
        };
        const data = await got.get(`${url}/${req.query.libraryId}/videos`, options).json();
        res.json({
            message: "Videos fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({
            message: "Failed to fetch videos",
            error: error.message
        });
    }
};

const getVideo = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.LIBRARY_API_KEY },
        };
        const data = await got.get(`${url}/${req.query.libraryId}/videos/${req.params.id}`, options).json();
        res.json({
            message: "Video fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching video:", error);
        res.status(500).json({
            message: "Failed to fetch video",
            error: error.message
        });
    }
};

const uploadVideo = async (req, res) => {
    try {
        const options = {
            headers: {
                accept: 'application/json',
                AccessKey: process.env.LIBRARY_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: req.body.title, collectionId: req.body.collectionId || '', thumbnailTime: req.body.thumbnailTime || 0 }),
        };
        const data = await got.post(`${url}/${req.body.libraryId}/videos`, options).json();
        res.json({
            message: "Video uploaded successfully",
            data
        });
    } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({
            message: "Failed to upload video",
            error: error.message
        });
    }
};

const deleteVideo = async (req, res) => {
    try {
        const options = {
            headers: { accept: 'application/json', AccessKey: process.env.LIBRARY_API_KEY },
        };
        await got.delete(`${url}/${req.query.libraryId}/videos/${req.params.id}`, options);
        res.json({
            message: "Video deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({
            message: "Failed to delete video",
            error: error.message
        });
    }
};

const getCaptionsList = (req, res) => {
    res.json({
        message: "Captions list fetched successfully",
        data: captionsList
    });
};

export { getVideos, getVideo, uploadVideo, deleteVideo, getCaptionsList };