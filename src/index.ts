import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// --- TYPESCRIPT INTERFACES ---
interface Mapping {
    pipedriveKey: string;
    inputKey: string;
}

interface PipedrivePerson {
    id?: number;
    name: string;
    [key: string]: any; 
}

// --- EDGE CASE HANDLING: Nested JSON Paths ---
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// --- MAIN FUNCTION ---
const syncPdPerson = async (): Promise<PipedrivePerson> => {
  try {
    const API_KEY = process.env.PIPEDRIVE_API_KEY;
    const DOMAIN = process.env.PIPEDRIVE_COMPANY_DOMAIN;

    if (!API_KEY || !DOMAIN) {
        throw new Error("Missing PIPEDRIVE_API_KEY or PIPEDRIVE_COMPANY_DOMAIN in .env file.");
    }

    const BASE_URL = `https://${DOMAIN}.pipedrive.com/v1`;

    // Read JSON Files
    // Read JSON Files
    const inputDataPath = path.join(__dirname, '../src/mappings', 'inputData.json');
    const mappingsPath = path.join(__dirname, '../src/mappings', 'mappings.json');

    const inputData = JSON.parse(fs.readFileSync(inputDataPath, 'utf-8'));
    const mappings: Mapping[] = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));

    // Map the Data
    const pipedrivePayload: any = {};
    for (const map of mappings) {
        const value = getNestedValue(inputData, map.inputKey);
        if (value !== undefined) {
            pipedrivePayload[map.pipedriveKey] = value;
        }
    }

    // EDGE CASE: Missing Required Field
    if (!pipedrivePayload.name) {
        throw new Error("Missing required unique identifier (name).");
    }

    // Search Pipedrive for existing person
    const searchUrl = `${BASE_URL}/persons/search?term=${encodeURIComponent(pipedrivePayload.name)}&exact_match=1&api_token=${API_KEY}`;
    const searchRes = await fetch(searchUrl);
    
    // EDGE CASE: API Network Errors
    if (!searchRes.ok) {
        throw new Error(`Search API failed with HTTP status: ${searchRes.status}`);
    }
    
    const searchData = await searchRes.json();
    const searchItems = searchData.data?.items || [];
    
    // Create or Update
    if (searchItems.length > 0) {
        const personId = searchItems[0].item.id;
        const updateUrl = `${BASE_URL}/persons/${personId}?api_token=${API_KEY}`;
        const updateRes = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pipedrivePayload)
        });

        if (!updateRes.ok) throw new Error(`Update API failed with HTTP status: ${updateRes.status}`);
        const updateData = await updateRes.json();
        return updateData.data as PipedrivePerson;
        
    } else {
        const createUrl = `${BASE_URL}/persons?api_token=${API_KEY}`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pipedrivePayload)
        });

        if (!createRes.ok) throw new Error(`Create API failed with HTTP status: ${createRes.status}`);
        const createData = await createRes.json();
        return createData.data as PipedrivePerson;
    }

  } catch (error: any) {
    console.error("❌ Error syncing person to Pipedrive:", error.message);
    throw error;
  }
};

// Execute the function
syncPdPerson();