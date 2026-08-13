# Pipedrive Data Synchronization Assignment

## Overview
This project implements the `syncPdPerson()` function to read input data, map it according to configuration files, and synchronize it with the Pipedrive API by creating or updating a Person.

## Edge Cases Handled

As per the assignment requirements, the following edge cases were identified and handled appropriately:

### 1. Missing Required Name Field for Pipedrive
* **The Problem:** The Pipedrive API requires a name to create a new person. If `inputData.json` is missing the field mapped to the Pipedrive `name` (or if it is empty/null), the API will reject the request with a 400 Bad Request error.
* **The Solution:** Before making any API calls, the code validates that the mapped `name` value exists. If it is missing, the function safely aborts or logs a descriptive error rather than attempting a doomed API call.

### 2. Multiple Persons Found with the Same Name
* **The Problem:** The assignment instructs to search for an existing person by name. However, Pipedrive might return multiple people with the exact same name (e.g., multiple people named "John Doe"). 
* **The Solution:** When the search API returns an array of multiple matches, the code safely extracts the very first exact match (`data[0]`) and updates that specific person's ID, rather than failing or trying to update multiple records at once.

### 3. Missing Fields in Input Data
* **The Problem:** The `mappings.json` file might contain an `inputKey` that simply does not exist in `inputData.json` (e.g., looking for a `phoneNumber` when only an email is provided).
* **The Solution:** The data mapping logic uses safe extraction. If an `inputKey` is missing, it skips that field or assigns a safe fallback value, ensuring that `undefined` values do not break the payload sent to the Pipedrive API.