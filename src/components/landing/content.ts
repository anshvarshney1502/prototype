// Example conversations and practice fixes per business type, in both languages.
export type Biz = "clinic" | "salon" | "restaurant" | "realEstate" | "coaching" | "shop";
export type Line = { who: "caller" | "munshi" | "action"; text: string };

export const PHONE: { biz: Biz; name: { en: string; hi: string }; en: Line[]; hi: Line[] }[] = [
  {
    biz: "clinic", name: { en: "Sharma Dental Clinic", hi: "शर्मा डेंटल क्लिनिक" },
    en: [
      { who: "munshi", text: "Hello, this is the AI receptionist at Sharma Dental. How can I help?" },
      { who: "caller", text: "Is Saturday 11 am free?" },
      { who: "action", text: "Checked the calendar" },
      { who: "munshi", text: "Yes, 11 am is free. May I have your name and number?" },
      { who: "caller", text: "Anjali, 98111 22334." },
      { who: "action", text: "Booked · bk_7f3a21" },
      { who: "munshi", text: "Done, Anjali. Saturday 11 am. Your booking ID is bk 7f3a21." },
    ],
    hi: [
      { who: "munshi", text: "नमस्ते, मैं शर्मा डेंटल की AI रिसेप्शनिस्ट हूँ। बताइए, कैसे मदद करूँ?" },
      { who: "caller", text: "शनिवार 11 बजे खाली है?" },
      { who: "action", text: "कैलेंडर देखा" },
      { who: "munshi", text: "जी, 11 बजे खाली है। आपका नाम और नंबर बता दीजिए?" },
      { who: "caller", text: "अंजलि, 98111 22334." },
      { who: "action", text: "बुक हुई · bk_7f3a21" },
      { who: "munshi", text: "हो गया अंजलि जी। शनिवार 11 बजे। आपकी बुकिंग ID है bk 7f3a21." },
    ],
  },
  {
    biz: "salon", name: { en: "Glow Studio Salon", hi: "ग्लो स्टूडियो सैलून" },
    en: [
      { who: "munshi", text: "Hi, you've reached Glow Studio's AI assistant. What can I do for you?" },
      { who: "caller", text: "How much is a haircut and hair spa?" },
      { who: "munshi", text: "Haircut is ₹400 and hair spa is ₹1,200. Shall I book you in?" },
      { who: "caller", text: "Tomorrow evening, 6 pm." },
      { who: "action", text: "Booked · bk_21c9e0" },
      { who: "munshi", text: "Booked for 6 pm tomorrow. See you then!" },
    ],
    hi: [
      { who: "munshi", text: "नमस्ते, ग्लो स्टूडियो की AI असिस्टेंट बोल रही हूँ। बताइए?" },
      { who: "caller", text: "हेयरकट और हेयर स्पा कितने का है?" },
      { who: "munshi", text: "हेयरकट ₹400 और हेयर स्पा ₹1,200 का है। बुक कर दूँ?" },
      { who: "caller", text: "कल शाम 6 बजे।" },
      { who: "action", text: "बुक हुई · bk_21c9e0" },
      { who: "munshi", text: "कल शाम 6 बजे बुक हो गया। मिलते हैं!" },
    ],
  },
  {
    biz: "restaurant", name: { en: "Spice Route Kitchen", hi: "स्पाइस रूट किचन" },
    en: [
      { who: "munshi", text: "Spice Route Kitchen, AI assistant speaking. How can I help?" },
      { who: "caller", text: "Table for 6 tonight at 8? It's my mother's birthday." },
      { who: "action", text: "Checked the calendar" },
      { who: "munshi", text: "8 pm is full, but 8:30 is free for 6. Shall I book it?" },
      { who: "caller", text: "Yes please. Rohit, 99887 11223." },
      { who: "action", text: "Booked · bk_9b04de" },
      { who: "munshi", text: "Done, Rohit. 8:30 tonight, table for 6. Happy birthday to her!" },
    ],
    hi: [
      { who: "munshi", text: "स्पाइस रूट किचन, AI असिस्टेंट बोल रही हूँ। बताइए?" },
      { who: "caller", text: "आज रात 8 बजे 6 लोगों की टेबल मिलेगी? मम्मी का बर्थडे है।" },
      { who: "action", text: "कैलेंडर देखा" },
      { who: "munshi", text: "8 बजे भरा है, पर 8:30 पर 6 लोगों की जगह है। बुक कर दूँ?" },
      { who: "caller", text: "हाँ प्लीज़। रोहित, 99887 11223." },
      { who: "action", text: "बुक हुई · bk_9b04de" },
      { who: "munshi", text: "हो गया रोहित जी। आज रात 8:30, 6 लोग। मम्मी को जन्मदिन की बधाई!" },
    ],
  },
];

export const PRACTICE: {
  biz: Biz;
  en: { q: string; bad: string; fix: string; good: string };
  hi: { q: string; bad: string; fix: string; good: string };
}[] = [
  {
    biz: "clinic",
    en: { q: "How much is teeth whitening?", bad: "Teeth whitening is ₹3,000.", fix: "If a price isn't on my list, don't guess. Offer a call back.", good: "Whitening isn't on our price list, so I can't confirm it. Can I take your number so the clinic calls you back?" },
    hi: { q: "दाँत सफ़ेद करवाने का कितना लगेगा?", bad: "दाँत सफ़ेद करने का ₹3,000 लगेगा।", fix: "अगर दाम लिस्ट में नहीं है, तो अंदाज़ा मत लगाओ। वापस कॉल का बोलो।", good: "ये हमारी दाम-लिस्ट में नहीं है, तो मैं पक्का नहीं बता सकती। नंबर दे दीजिए, क्लिनिक से आपको कॉल आ जाएगी।" },
  },
  {
    biz: "salon",
    en: { q: "Can you do bridal makeup on the 14th for ₹5,000?", bad: "Sure, ₹5,000 for bridal makeup on the 14th is fine.", fix: "Never agree to a discount. Only quote listed prices.", good: "Our bridal package is ₹12,000. I can't change prices, but I can book a free trial on the 14th. Would that help?" },
    hi: { q: "14 तारीख़ को ₹5,000 में ब्राइडल मेकअप कर दोगे?", bad: "जी, 14 तारीख़ को ₹5,000 में हो जाएगा।", fix: "कभी डिस्काउंट मत देना। सिर्फ़ लिस्ट वाले दाम बताना।", good: "हमारा ब्राइडल पैकेज ₹12,000 का है। मैं दाम नहीं बदल सकती, पर 14 को फ़्री ट्रायल बुक कर सकती हूँ। ठीक रहेगा?" },
  },
  {
    biz: "restaurant",
    en: { q: "Is your biryani completely nut-free? My son is allergic.", bad: "Yes, it's completely nut-free, don't worry.", fix: "For allergies, never promise. Ask the chef to call back.", good: "I don't want to guess about an allergy. Let me have the chef call you back in a few minutes. What's your number?" },
    hi: { q: "क्या आपकी बिरयानी में बिल्कुल भी नट्स नहीं हैं? बेटे को एलर्जी है।", bad: "हाँ जी, बिल्कुल नट्स नहीं हैं, चिंता मत कीजिए।", fix: "एलर्जी के बारे में कभी वादा मत करना। शेफ़ से कॉल करवाना।", good: "एलर्जी के बारे में मैं अंदाज़ा नहीं लगाऊँगी। शेफ़ आपको कुछ मिनट में कॉल करेंगे। आपका नंबर?" },
  },
];

export const STARTERS: { biz: Biz; en: string; hi: string }[] = [
  { biz: "clinic", en: "Sharma Dental Clinic in Indirapuram, open Mon–Sat 10 am to 8 pm. Book appointments and tell prices: cleaning ₹1,200, filling ₹1,500, root canal from ₹6,000. If a patient is in pain, ask me to call back. Speak Hindi and English. Never give medical advice.", hi: "शर्मा डेंटल क्लिनिक, इंदिरापुरम, सोम–शनि सुबह 10 से रात 8 बजे। अपॉइंटमेंट बुक करो और दाम बताओ: सफ़ाई ₹1,200, फ़िलिंग ₹1,500, रूट कैनाल ₹6,000 से। मरीज़ को दर्द हो तो मुझसे कॉल करवाओ। हिंदी और इंग्लिश बोलो। कभी दवा की सलाह मत देना।" },
  { biz: "salon", en: "Glow Studio salon in Koramangala, open daily 10 am to 8 pm. Book visits. Prices: haircut ₹400, hair spa ₹1,200, bridal package ₹12,000. Never give discounts. Speak Hindi and English.", hi: "ग्लो स्टूडियो सैलून, कोरमंगला, रोज़ सुबह 10 से रात 8 बजे। बुकिंग करो। दाम: हेयरकट ₹400, हेयर स्पा ₹1,200, ब्राइडल पैकेज ₹12,000। कभी डिस्काउंट मत देना। हिंदी और इंग्लिश बोलो।" },
  { biz: "restaurant", en: "Spice Route Kitchen in Saket, open 12 pm to 11 pm. Take table bookings. Thali ₹350, biryani ₹420. For allergy questions, ask me to call back. Hindi and English.", hi: "स्पाइस रूट किचन, साकेत, दोपहर 12 से रात 11 बजे। टेबल बुक करो। थाली ₹350, बिरयानी ₹420। एलर्जी के सवाल पर मुझसे कॉल करवाओ। हिंदी और इंग्लिश।" },
  { biz: "realEstate", en: "Green Acres Realty in Noida. Answer questions about 2 and 3 BHK flats, ask budget and area, and book site visits. Never promise discounts. Hindi and English.", hi: "ग्रीन एकर्स रियल्टी, नोएडा। 2 और 3 BHK फ़्लैट के सवालों के जवाब दो, बजट और जगह पूछो, साइट विज़िट बुक करो। कभी डिस्काउंट का वादा मत करना। हिंदी और इंग्लिश।" },
  { biz: "coaching", en: "Sunrise Coaching Centre in Kota. Answer questions about batches and fees (JEE batch ₹85,000 a year), and book a free demo class. Hindi and English.", hi: "सनराइज़ कोचिंग सेंटर, कोटा। बैच और फ़ीस के सवालों के जवाब दो (JEE बैच ₹85,000 सालाना), और फ़्री डेमो क्लास बुक करो। हिंदी और इंग्लिश।" },
  { biz: "shop", en: "Gupta Electronics in Lajpat Nagar, open 11 am to 9 pm, closed Tuesday. Tell people if we have a product, take their number for orders, and book repair pick-ups. Hindi and English.", hi: "गुप्ता इलेक्ट्रॉनिक्स, लाजपत नगर, सुबह 11 से रात 9 बजे, मंगलवार बंद। बताओ कि सामान है या नहीं, ऑर्डर के लिए नंबर लो, और रिपेयर पिक-अप बुक करो। हिंदी और इंग्लिश।" },
];

export const BIZ_KEY = {
  clinic: "bizClinic", salon: "bizSalon", restaurant: "bizRestaurant", realEstate: "bizRealEstate", coaching: "bizCoaching", shop: "bizShop",
} as const;
