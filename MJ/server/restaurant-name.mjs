// Conservative OCR-only extraction: no LLM request, no guessed restaurant name.
const venue = /(?<!\p{L})(?:ristorante|trattoria|osteria|pizzeria|restaurant|restaurante|restauracja|restaurang|bistro|bistrot|brasserie|taverna|taverne|tavern|gasthaus|gasthof|café|cafe|caffè|caffe|pub|steakhouse|churrascaria)(?!\p{L})/iu;
const generic = /^(?:menu|menù|menú|carte|la carte|lunch|dinner|breakfast|primi|secondi|antipasti|dolci|dessert|desserts|drinks|beverages|wine|wines|pasta|pizza|pizze|salads?|sandwiches|sides|coffee|paella|tapas|specials?|chef.?s? (?:menu|specials?|features))$/iu;
const food = /\b(?:spaghetti|risotto|gnocchi|lasagn[ae]|pomodoro|vongole|carbonara|bolognese|fettuccine|tagliatelle|soup|salad|burger|chicken|beef|pork|salmon|fries|cake|tiramisu|espresso|cappuccino|bruschetta|carpaccio|penne|ravioli|tortellini)\b/iu;
const address = /\b(?:via|viale|piazza|rue|avenue|boulevard|calle|plaza|straße|strasse|street|road)\b/iu;
function plausible(line) {
  return line.length >= 3 && line.length <= 100 && /\p{L}/u.test(line) && !generic.test(line) &&
    !/[€$£¥]|\d|https?:|www\.|@/iu.test(line) && !food.test(line) && !address.test(line) &&
    !/allerg|gluten|vegan|vegetarian|service|coperto|tax|vat|hours|opening|takeaway|delivery/iu.test(line);
}
export function extractRestaurant(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim().replace(/\s+/g,' ')).filter(Boolean);
  const top = lines.slice(0,12);
  let name = '';
  for (let index = 0; index < top.length; index++) {
    const line = top[index];
    if (!venue.test(line) || !plausible(line)) continue;
    const rest = line.replace(venue,'').replace(/[\s&·-]/g,'');
    if (generic.test(rest)) continue;
    if (rest.length >= 2 && !generic.test(rest)) { name = line; break; }
    if (top[index+1] && plausible(top[index+1]) && !venue.test(top[index+1])) { name = `${line} ${top[index+1]}`; break; }
  }
  // A short cover heading immediately followed by MENU is a name candidate.
  // Skip dish names/sections/prices; ambiguous text falls through to translation.
  if (!name) {
    const menuIndex = top.findIndex(line => /^(?:menu|menù|menú|la carte)$/iu.test(line));
    if (menuIndex > 0 && menuIndex <= 3) {
      const heading = top.slice(0,menuIndex).filter(line => plausible(line) && line.replace(venue, '').trim().length > 1);
      if (heading.length === 1 && heading[0].split(' ').length <= 6) name = heading[0];
    }
  }
  if (!name) return { restaurantName: null, restaurantQuery: null };
  const street = top.find(line => address.test(line) && /\d/.test(line) && line.length <= 90 && !/[€$£]/u.test(line));
  return { restaurantName: name, restaurantQuery: `${name}${street ? ' '+street : ''}`.slice(0,200) };
}
