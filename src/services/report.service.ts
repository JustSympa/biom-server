import OpenAI from "openai";
import config from "@config"
import { ResponseInputContent } from "openai/resources/responses/responses.mjs";


export interface ReportInput {
	imagesBase64: {img: string, mimeType: string}[];
	latitude?: number;
	longitude?: number;
	description: string;
	language?: "en" | "fr";
}

export interface ReportMeta {
	responseId: string
	plantName: string | null;
	healthStatus: "healthy" | "diseased" | "stressed" | "unknown";
	severity: "low" | "medium" | "high" | null;
	disease:string | null;
	diseaseDescription: string | null;
	confidence: number;
	causes: string[];
	symptoms: string[];
	immediateSolutions: string[];
	longTermSolutions: string[];
	preventionTips: string[];
	disclaimer: string;
}

export interface Report {
	metadata: ReportMeta
	report: string
}

const INSTRUCTIONS = `
You are an expert plant pathologist and agronomist.
Your job is to analyze plant images and produce a detailed health diagnosis report.
The user will give photos, GPS coordinates of a plant and brief description of what's going wrong.

Using these coordinates, consider:
- The local climate zone (tropical, arid, temperate, etc.)
- Native plants typical to this region
- Diseases and pests common to this geographic area
- Seasonal conditions that may affect plant health

Analyze the plant in the images, taking into consideration GPS info and problem description, and provide a structured diagnosis in which we have:

1. PLANT SPECIES: Identify the plant species or family
2. GEOGRAPHIC CONTEXT: Brief note on the climate/region based on GPS and how it affects this plant
3. DETECTED ISSUES: List any visible diseases, pests, or nutrient deficiencies
4. SEVERITY: Rate as Healthy / Mild / Moderate / Severe
5. PROBABLE CAUSE: Explain what likely caused the issue given the regional conditions
6. TREATMENT: Step-by-step recommended treatment in simple language
7. PREVENTION: Tips to prevent recurrence in this specific climate

If the image does not contain a plant, ajust the response fields.
Keep the language simple enough for a non-expert farmer to understand.
The report and metadata will be in the language specified by the user or in english if no language is specified

The output will be in JSON in the following format:
{
	metadata: {
		plantName: name of the plant and null if no plant was found in on the images,
		healthStatus: "healthy" | "diseased" | "stressed" | "unknown",
		severity: "low" | "medium" | "high" or null if healthy,
		disease: name of the disease if the plant is sick otherwise null,
		diseaseDescription: as the name suggests and null if healthy,
		confidence: confidence of the diagnosis as a percentage number,
		causes: string[] list the potential cause,
		symptoms: string[] list of observable symptoms,
		immediateSolutions: string[] list of immediate solutions,
		longTermSolutions: string[] list of long term solutions,
		preventionTips: string[] list of prevention tips,
		disclaimer: a short reminder that this is an AI diagnosis and a specialist should be consulted for critical decisions,
	},
	report: The actual full report to be displayed, the text content must be in Markdown Format
}
`
;

function buildUserPrompt(input: ReportInput): string {
	const { latitude, longitude, description, language } = input;

	const geoBlock = latitude !== undefined && longitude !== undefined ?
		`Geographic context: latitude ${latitude}, longitude ${longitude}. Use these coordinates to enrich the diagnosis with regional information (climate, local pests, endemic diseases, etc.).`
		: `No GPS data provided.`
	const langBlock = `The report and Metadata will be in ${language == 'fr' ? 'french' : 'english'}`
	const contextBlock = `Context(in ${language == 'fr' ? 'french' : 'english'}): ${description}`
	return `Analyze the attached plant images and generate a complete diagnosis report.
${geoBlock}
${langBlock}
${contextBlock}`;
}

const client = new OpenAI({
	apiKey: config.OPENAI_API_KEY,
});

export async function generatePlantReport(input: ReportInput): Promise<Report> {
	const { imagesBase64 } = input;
	const messageContent: ResponseInputContent[] = imagesBase64.map(img => 
		({ detail: 'auto', type: 'input_image', image_url: `data:${img.mimeType};base64,${img.img}` })
	)
	messageContent.push({ type: 'input_text', text: buildUserPrompt(input) })
	const response = await client.responses.create({
		model: "gpt-5-nano",
		instructions: INSTRUCTIONS,
		input:[{
			role: 'user',
			type: 'message',
			content: messageContent
		}]
	});

	try {
		const result = JSON.parse(response.output_text) as Report;
		result.metadata.responseId = response.id;
		return result;
	} catch {
		throw new Error(`OpenAI returned non-parseable JSON: ${response.output_text.slice(0, 200)}`);
	}
// 	return {
// 		metadata: {
// 			"plantName": "Cordyline sp. (ti plant) / Dracaena-type monocot with strap-like leaves",
// 			"healthStatus": "diseased",
// 			"severity": "medium",
// 			"disease": "Armored scale insect infestation",
// 			"diseaseDescription": "White crusty scale insects clustered on leaves and along the leaf base, sap-sucking pests causing discoloration and leaf stress",
// 			"confidence": 0.68,
// 			"causes": [
// 				"Armored scale insects (Diaspididae) infestation",
// 				"Warm, humid conditions favor scale outbreaks common on tropical/subtropical ornamentals",
// 				"Possible introduction from new plants or garden equipment"
// 			],
// 			"symptoms": [
// 				"White crusty patches (scale) on leaves",
// 				"Reddish/purplish tint and browning along affected leaf areas",
// 				"General leaf stress that may lead to yellowing or necrosis if untreated"
// 			],
// 			"immediateSolutions": [
// 				"Isolate the plant from others to prevent spread",
// 				"Gently rub each scale with a cotton swab dipped in 70% isopropyl alcohol to kill and remove it",
// 				"Wipe away loosened crusts and repeat as needed",
// 				"Follow up with a spray of horticultural oil or insecticidal soap, coating both sides of leaves and stems",
// 				"Repeat treatment every 7 days for 3–4 weeks"
// 			],
// 			"longTermSolutions": [
// 				"If infestations persist, use a systemic insecticide labeled for scale on Cordyline/Dracaena plants (follow label directions)",
// 				"Remove heavily infested leaves if they remain diseased or die back",
// 				"Improve cultural conditions to reduce susceptibility (see prevention tips)"
// 			],
// 			"preventionTips": [
// 				"Quarantine new plants for 2–4 weeks before integrating them with other ornamentals",
// 				"Regularly inspect and gently clean foliage to remove dust and early pest signs",
// 				"Avoid overwatering and ensure good drainage to reduce excessive humidity around leaves",
// 				"Provide good air circulation and appropriate light to keep plant vigor high",
// 				"Consider preventive horticultural oil applications during the growing season in areas prone to scale"
// 			],
// 			"disclaimer": "This diagnosis is AI-generated. For critical plant health decisions, consult a local horticulture specialist.",
// 			"responseId": "resp_0a4ef1bea6b4a1530069d511deb62c81a09925c17328bd912e",
// 			// "id": "resp_0a4ef1bea6b4a1530069d511deb62c81a09925c17328bd912e",
// 			// "createdAt": "2026-04-07T14:17:58.163Z",
// 		},
//   	"report": "# Plant Health Diagnosis Report\n\n## Plant: Cordyline sp. (ti plant) - likely Cordyline terminalis or a nearby Cordyline/Dracaena-type monocot\n\n## Geographic Context\n- GPS data was not provided. Cordyline species are common in tropical/subtropical regions. In warm, humid climates, scale insects thrive on ornamental monocots and can spread quickly if not managed.\n\n## Detected Issues\n- Armored scale insect infestation on leaves (visible as white crusty patches)\n- Leaf discoloration (reddish/purple tinge on some leaves) and browning along affected areas, suggesting pest stress\n\n## Severity\n- Moderate\n\n## Probable Cause\n- Infestation by armored scale insects feeding on sap, likely introduced via a new plant or through garden tools. Warm, humid conditions in tropical/subtropical settings favor scale populations and reproduction.\n\n## Treatment (step-by-step)\n1. Isolate the plant from other susceptible ornamentals to prevent spread.\n2. Gently rub each scale with a cotton swab dipped in 70% isopropyl alcohol to dissolve and remove the insects. Wipe away the crusty residue.\n3. After manual removal, spray the plant with a horticultural oil or insecticidal soap, ensuring coverage on both sides of the leaves and along the stems.\n4. Repeat the treatment weekly for 3–4 weeks to break the pest life cycle.\n5. For heavy or persistent infestations, consider a systemic insecticide labeled for scale on Cordyline/Dracaena and follow the product instructions. Consult a local extension service if needed.\n6. Remove severely infested leaves if they do not recover.\n\n## Prevention\n- Inspect new plants before introducing them to the garden and quarantine for 2–4 weeks.\n- Keep foliage clean and free of dust; wipe leaves periodically.\n- Avoid overwatering and ensure good drainage to minimize favorable moisture for pests.\n- Improve air circulation and provide appropriate light to support plant vigor.\n- Consider preventive applications of horticultural oil during the growing season in pest-prone areas.\n\n## Notes\n- If symptoms worsen or you observe mold, root issues, or extensive tissue damage, seek in-person advice from a horticulture specialist.\n\n---\nThis diagnosis is generated by AI. Accuracy may vary; a professional assessment is recommended for critical decisions."
// }
}