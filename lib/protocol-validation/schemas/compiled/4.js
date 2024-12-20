"use strict";
export const validate = validate177;
export default validate177;
const schema146 = {"$schema":"http://json-schema.org/draft-07/schema#","$ref":"#/definitions/Protocol","definitions":{"Protocol":{"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"description":{"type":"string"},"lastModified":{"type":"string","format":"date-time"},"schemaVersion":{"type":"number"},"codebook":{"$ref":"#/definitions/codebook"},"assetManifest":{"$ref":"#/definitions/AssetManifest"},"stages":{"type":"array","items":{"$ref":"#/definitions/Stage"}}},"required":["stages","codebook"],"title":"Protocol"},"AssetManifest":{"type":"object","title":"AssetManifest"},"Form":{"type":["object","null"],"additionalProperties":false,"properties":{"title":{"type":"string"},"fields":{"type":"array","items":{"$ref":"#/definitions/Field"}}},"required":["fields"],"title":"Form"},"Field":{"type":"object","additionalProperties":false,"properties":{"variable":{"type":"string"},"prompt":{"type":"string"}},"required":["variable","prompt"],"title":"Field"},"Stage":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["Narrative","AlterForm","AlterEdgeForm","EgoForm","NameGenerator","NameGeneratorQuickAdd","NameGeneratorList","NameGeneratorAutoComplete","Sociogram","DyadCensus","Information","OrdinalBin","CategoricalBin"]},"label":{"type":"string"},"form":{"$ref":"#/definitions/Form"},"quickAdd":{"type":["string","null"]},"createEdge":{"type":"string"},"dataSource":{"type":["string","null"]},"subject":{"$ref":"#/definitions/Subject"},"panels":{"type":"array","items":{"$ref":"#/definitions/Panel"}},"prompts":{"type":"array","items":{"$ref":"#/definitions/Prompt"},"minItems":1},"presets":{"type":"array","items":{"$ref":"#/definitions/Preset"},"minItems":1},"background":{"type":"object","$ref":"#/definitions/Background","minProperties":1},"sortOptions":{"$ref":"#/definitions/SortOptions"},"cardOptions":{"type":"object","$ref":"#/definitions/CardOptions"},"searchOptions":{"type":"object","$ref":"#/definitions/SearchOptions"},"behaviours":{"type":"object","$ref":"#/definitions/Behaviours","minProperties":1},"showExistingNodes":{"type":"boolean"},"title":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/definitions/Item"}},"introductionPanel":{"$ref":"#/definitions/IntroductionPanel"},"skipLogic":{"$ref":"#/definitions/SkipLogic"},"filter":{"$ref":"#/definitions/Filter"}},"required":["id","label","type"],"title":"Interface","anyOf":[{"properties":{"type":{"const":"EgoForm"}},"required":["form","introductionPanel"]},{"properties":{"type":{"const":"DyadCensus"}},"required":["subject","introductionPanel"]},{"properties":{"type":{"const":"AlterForm"}},"required":["form","introductionPanel"]},{"properties":{"type":{"const":"AlterEdgeForm"}},"required":["form","introductionPanel"]},{"properties":{"type":{"const":"Information"}},"required":["items"]},{"properties":{"type":{"const":"Narrative"}},"required":["presets","background"]},{"properties":{"type":{"enum":["NameGenerator","NameGeneratorQuickAdd","NameGeneratorList","NameGeneratorAutoComplete","Sociogram","OrdinalBin","CategoricalBin","DyadCensus"]}},"required":["prompts"]}]},"Item":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["text","asset"]},"content":{"type":"string"},"description":{"type":"string"},"size":{"type":"string"},"loop":{"type":"boolean"}},"required":["content","id","type"],"title":"Item"},"IntroductionPanel":{"type":"object","additionalProperties":false,"properties":{"title":{"type":"string"},"text":{"type":"string"}},"required":["title","text"]},"Panel":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"title":{"type":"string"},"filter":{"$ref":"#/definitions/Filter"},"dataSource":{"type":["string","null"]}},"required":["id","title","dataSource"],"title":"Panel"},"Filter":{"type":["object","null"],"additionalProperties":false,"properties":{"join":{"type":"string","enum":["OR","AND"]},"rules":{"type":"array","items":{"$ref":"#/definitions/Rule"}}},"title":"Filter"},"Rule":{"type":"object","additionalProperties":false,"properties":{"type":{"type":"string","enum":["alter","ego","edge"]},"id":{"type":"string"},"options":{"$ref":"#/definitions/Options"}},"required":["id","options","type"],"title":"Rule"},"Options":{"type":"object","additionalProperties":false,"properties":{"type":{"type":"string"},"attribute":{"type":"string"},"operator":{"type":"string","enum":["EXISTS","NOT_EXISTS","EXACTLY","NOT","GREATER_THAN","GREATER_THAN_OR_EQUAL","LESS_THAN","LESS_THAN_OR_EQUAL","INCLUDES","EXCLUDES"]},"value":{"type":["integer","string","boolean"]}},"required":["operator"],"title":"Rule Options","allOf":[{"if":{"properties":{"operator":{"enum":["EXACTLY","NOT","GREATER_THAN","GREATER_THAN_OR_EQUAL","LESS_THAN","LESS_THAN_OR_EQUAL","INCLUDES","EXCLUDES"]}}},"then":{"required":["value"]}}]},"Prompt":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"text":{"type":"string"},"additionalAttributes":{"$ref":"#/definitions/AdditionalAttributes"},"variable":{"type":"string"},"otherVariable":{"type":"string"},"otherVariablePrompt":{"type":"string"},"otherOptionLabel":{"type":"string"},"bucketSortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"binSortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"sortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"color":{"type":"string"},"layout":{"$ref":"#/definitions/Layout"},"edges":{"$ref":"#/definitions/Edges"},"highlight":{"$ref":"#/definitions/Highlight"},"createEdge":{"type":"string"}},"required":["id","text"],"title":"Prompt"},"Preset":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"label":{"type":"string"},"layoutVariable":{"type":"string"},"groupVariable":{"type":"string"},"edges":{"$ref":"#/definitions/Edges"},"highlight":{"$ref":"#/definitions/NarrativeHighlight"}},"required":["id","label","layoutVariable"],"title":"Preset"},"Behaviours":{"type":"object","additionalProperties":false,"properties":{"freeDraw":{"type":"boolean"},"featureNode":{"type":"boolean"},"allowRepositioning":{"type":"boolean"}},"required":[],"title":"Behaviours"},"AdditionalAttributes":{"type":"array","title":"AdditionalAttributes","items":{"$ref":"#/definitions/AdditionalAttribute"}},"AdditionalAttribute":{"type":"object","additionalProperties":false,"properties":{"variable":{"type":"string"},"value":{"type":["boolean"]}},"required":["variable","value"],"title":"AdditionalAttribute"},"Background":{"type":"object","additionalProperties":false,"properties":{"image":{"type":"string"},"concentricCircles":{"type":"integer"},"skewedTowardCenter":{"type":"boolean"}},"title":"Background"},"SortOrder":{"type":"object","additionalProperties":false,"properties":{"property":{"type":"string"},"direction":{"$ref":"#/definitions/Direction"}},"required":["direction","property"],"title":"SortOrder"},"CardOptions":{"type":"object","additionalProperties":false,"properties":{"displayLabel":{"type":"string"},"additionalProperties":{"type":"array","items":{"$ref":"#/definitions/Property"}}},"title":"CardOptions"},"Property":{"type":"object","additionalProperties":false,"properties":{"label":{"type":"string"},"variable":{"type":"string"}},"required":["label","variable"],"title":"Property"},"Edges":{"type":"object","additionalProperties":false,"properties":{"display":{"type":"array","items":{"type":"string"}},"create":{"type":"string"}},"required":[],"title":"Edges"},"NarrativeHighlight":{"type":"array","items":{"type":"string"},"title":"NarrativeHighlight"},"Highlight":{"type":"object","additionalProperties":false,"properties":{"variable":{"type":"string"},"allowHighlighting":{"type":"boolean"}},"required":["allowHighlighting"],"title":"Highlight"},"Layout":{"type":"object","additionalProperties":false,"properties":{"layoutVariable":{"type":"string"},"allowPositioning":{"type":"boolean"}},"required":["layoutVariable"],"title":"Layout"},"SearchOptions":{"type":"object","additionalProperties":false,"properties":{"fuzziness":{"type":"number"},"matchProperties":{"type":"array","items":{"type":"string"}}},"required":["fuzziness","matchProperties"],"title":"SearchOptions"},"SortOptions":{"type":"object","additionalProperties":false,"properties":{"sortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"sortableProperties":{"type":"array","items":{"$ref":"#/definitions/Property"}}},"required":["sortOrder","sortableProperties"],"title":"SortOptions"},"Subject":{"type":"object","additionalProperties":false,"properties":{"entity":{"$ref":"#/definitions/Entity"},"type":{"type":"string"}},"required":["entity","type"],"title":"Subject"},"SkipLogic":{"type":"object","additionalProperties":false,"properties":{"action":{"type":"string","enum":["SHOW","SKIP"]},"filter":{"$ref":"#/definitions/Filter"}},"required":["action","filter"],"title":"SkipLogic"},"codebook":{"type":"object","additionalProperties":false,"properties":{"node":{"$ref":"#/definitions/Node"},"edge":{"$ref":"#/definitions/Edge"},"ego":{"$ref":"#/definitions/Ego"}},"required":[],"title":"codebook"},"Edge":{"type":"object","additionalProperties":false,"title":"Edge","patternProperties":{".+":{"$ref":"#/definitions/EdgeTypeDef"}}},"EdgeTypeDef":{"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"color":{"type":"string"},"variables":{"$ref":"#/definitions/Variables"}},"required":["name","color"],"title":"EdgeTypeDef"},"Variables":{"type":"object","additionalProperties":false,"title":"Variables","patternProperties":{".+":{"$ref":"#/definitions/Variable"}}},"Variable":{"type":"object","additionalProperties":false,"properties":{"name":{"type":"string","pattern":"^[a-zA-Z0-9._:-]+$"},"type":{"type":"string","enum":["boolean","text","number","datetime","ordinal","scalar","categorical","layout","location"]},"component":{"type":"string","enum":["CheckboxGroup","Number","RadioGroup","Text","TextArea","Toggle","ToggleButtonGroup","Slider","VisualAnalogScale","LikertScale","DatePicker","RelativeDatePicker"]},"options":{"type":"array","items":{"$ref":"#/definitions/OptionElement"}},"parameters":{"type":"object"},"validation":{"$ref":"#/definitions/Validation"}},"required":["type","name"],"title":"Variable"},"OptionClass":{"type":"object","additionalProperties":false,"properties":{"label":{"type":"string"},"value":{"$ref":"#/definitions/Value"}},"required":["label","value"],"title":"OptionClass"},"Validation":{"type":"object","additionalProperties":false,"properties":{"required":{"type":"boolean"},"requiredAcceptsNull":{"type":"boolean"},"minLength":{"type":"integer"},"maxLength":{"type":"integer"},"minValue":{"type":"integer"},"maxValue":{"type":"integer"},"minSelected":{"type":"integer"},"maxSelected":{"type":"integer"}},"title":"Validation"},"Node":{"type":"object","additionalProperties":false,"title":"Node","patternProperties":{".+":{"$ref":"#/definitions/NodeTypeDef"}}},"NodeTypeDef":{"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"displayVariable":{"type":"string"},"iconVariant":{"type":"string"},"variables":{"$ref":"#/definitions/Variables"},"color":{"type":"string"}},"required":["name","color"],"title":"NodeTypeDef"},"Ego":{"type":"object","additionalProperties":false,"properties":{"variables":{"$ref":"#/definitions/Variables"}}},"OptionElement":{"anyOf":[{"$ref":"#/definitions/OptionClass"},{"type":"integer"},{"type":"string"}],"title":"Variable Option"},"Value":{"anyOf":[{"type":"integer"},{"type":"string","pattern":"^[a-zA-Z0-9._:-]+$"}],"title":"Value"},"Entity":{"type":"string","enum":["edge","node","ego"],"title":"Entity"},"Direction":{"type":"string","enum":["desc","asc"],"title":"Direction"}}};
const schema147 = {"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"description":{"type":"string"},"lastModified":{"type":"string","format":"date-time"},"schemaVersion":{"type":"number"},"codebook":{"$ref":"#/definitions/codebook"},"assetManifest":{"$ref":"#/definitions/AssetManifest"},"stages":{"type":"array","items":{"$ref":"#/definitions/Stage"}}},"required":["stages","codebook"],"title":"Protocol"};
const schema160 = {"type":"object","title":"AssetManifest"};
const formats0 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
const schema148 = {"type":"object","additionalProperties":false,"properties":{"node":{"$ref":"#/definitions/Node"},"edge":{"$ref":"#/definitions/Edge"},"ego":{"$ref":"#/definitions/Ego"}},"required":[],"title":"codebook"};
const schema149 = {"type":"object","additionalProperties":false,"title":"Node","patternProperties":{".+":{"$ref":"#/definitions/NodeTypeDef"}}};
const pattern0 = new RegExp(".+", "u");
const schema150 = {"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"displayVariable":{"type":"string"},"iconVariant":{"type":"string"},"variables":{"$ref":"#/definitions/Variables"},"color":{"type":"string"}},"required":["name","color"],"title":"NodeTypeDef"};
const schema151 = {"type":"object","additionalProperties":false,"title":"Variables","patternProperties":{".+":{"$ref":"#/definitions/Variable"}}};
const schema152 = {"type":"object","additionalProperties":false,"properties":{"name":{"type":"string","pattern":"^[a-zA-Z0-9._:-]+$"},"type":{"type":"string","enum":["boolean","text","number","datetime","ordinal","scalar","categorical","layout","location"]},"component":{"type":"string","enum":["CheckboxGroup","Number","RadioGroup","Text","TextArea","Toggle","ToggleButtonGroup","Slider","VisualAnalogScale","LikertScale","DatePicker","RelativeDatePicker"]},"options":{"type":"array","items":{"$ref":"#/definitions/OptionElement"}},"parameters":{"type":"object"},"validation":{"$ref":"#/definitions/Validation"}},"required":["type","name"],"title":"Variable"};
const schema156 = {"type":"object","additionalProperties":false,"properties":{"required":{"type":"boolean"},"requiredAcceptsNull":{"type":"boolean"},"minLength":{"type":"integer"},"maxLength":{"type":"integer"},"minValue":{"type":"integer"},"maxValue":{"type":"integer"},"minSelected":{"type":"integer"},"maxSelected":{"type":"integer"}},"title":"Validation"};
const pattern22 = new RegExp("^[a-zA-Z0-9._:-]+$", "u");
const schema153 = {"anyOf":[{"$ref":"#/definitions/OptionClass"},{"type":"integer"},{"type":"string"}],"title":"Variable Option"};
const schema154 = {"type":"object","additionalProperties":false,"properties":{"label":{"type":"string"},"value":{"$ref":"#/definitions/Value"}},"required":["label","value"],"title":"OptionClass"};
const schema155 = {"anyOf":[{"type":"integer"},{"type":"string","pattern":"^[a-zA-Z0-9._:-]+$"}],"title":"Value"};

function validate185(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.label === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "label"},message:"must have required property '"+"label"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "label") || (key0 === "value"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.label !== undefined){
if(typeof data.label !== "string"){
const err3 = {instancePath:instancePath+"/label",schemaPath:"#/properties/label/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.value !== undefined){
let data1 = data.value;
const _errs6 = errors;
let valid2 = false;
const _errs7 = errors;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err4 = {instancePath:instancePath+"/value",schemaPath:"#/definitions/Value/anyOf/0/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid2 = valid2 || _valid0;
if(!valid2){
const _errs9 = errors;
if(typeof data1 === "string"){
if(!pattern22.test(data1)){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/definitions/Value/anyOf/1/pattern",keyword:"pattern",params:{pattern: "^[a-zA-Z0-9._:-]+$"},message:"must match pattern \""+"^[a-zA-Z0-9._:-]+$"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/value",schemaPath:"#/definitions/Value/anyOf/1/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
var _valid0 = _errs9 === errors;
valid2 = valid2 || _valid0;
}
if(!valid2){
const err7 = {instancePath:instancePath+"/value",schemaPath:"#/definitions/Value/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate185.errors = vErrors;
return errors === 0;
}


function validate184(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
const _errs0 = errors;
let valid0 = false;
const _errs1 = errors;
if(!(validate185(data, {instancePath,parentData,parentDataProperty,rootData}))){
vErrors = vErrors === null ? validate185.errors : vErrors.concat(validate185.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs2 = errors;
if(!(((typeof data == "number") && (!(data % 1) && !isNaN(data))) && (isFinite(data)))){
const err0 = {instancePath,schemaPath:"#/anyOf/1/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var _valid0 = _errs2 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs4 = errors;
if(typeof data !== "string"){
const err1 = {instancePath,schemaPath:"#/anyOf/2/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
var _valid0 = _errs4 === errors;
valid0 = valid0 || _valid0;
}
}
if(!valid0){
const err2 = {instancePath,schemaPath:"#/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate184.errors = vErrors;
return errors === 0;
}


function validate183(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "name") || (key0 === "type")) || (key0 === "component")) || (key0 === "options")) || (key0 === "parameters")) || (key0 === "validation"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(!pattern22.test(data0)){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/pattern",keyword:"pattern",params:{pattern: "^[a-zA-Z0-9._:-]+$"},message:"must match pattern \""+"^[a-zA-Z0-9._:-]+$"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
else {
const err4 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err5 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!(((((((((data1 === "boolean") || (data1 === "text")) || (data1 === "number")) || (data1 === "datetime")) || (data1 === "ordinal")) || (data1 === "scalar")) || (data1 === "categorical")) || (data1 === "layout")) || (data1 === "location"))){
const err6 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema152.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.component !== undefined){
let data2 = data.component;
if(typeof data2 !== "string"){
const err7 = {instancePath:instancePath+"/component",schemaPath:"#/properties/component/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!((((((((((((data2 === "CheckboxGroup") || (data2 === "Number")) || (data2 === "RadioGroup")) || (data2 === "Text")) || (data2 === "TextArea")) || (data2 === "Toggle")) || (data2 === "ToggleButtonGroup")) || (data2 === "Slider")) || (data2 === "VisualAnalogScale")) || (data2 === "LikertScale")) || (data2 === "DatePicker")) || (data2 === "RelativeDatePicker"))){
const err8 = {instancePath:instancePath+"/component",schemaPath:"#/properties/component/enum",keyword:"enum",params:{allowedValues: schema152.properties.component.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.options !== undefined){
let data3 = data.options;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(!(validate184(data3[i0], {instancePath:instancePath+"/options/" + i0,parentData:data3,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate184.errors : vErrors.concat(validate184.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath:instancePath+"/options",schemaPath:"#/properties/options/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.parameters !== undefined){
let data5 = data.parameters;
if(!(data5 && typeof data5 == "object" && !Array.isArray(data5))){
const err10 = {instancePath:instancePath+"/parameters",schemaPath:"#/properties/parameters/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.validation !== undefined){
let data6 = data.validation;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
for(const key1 in data6){
if(!((((((((key1 === "required") || (key1 === "requiredAcceptsNull")) || (key1 === "minLength")) || (key1 === "maxLength")) || (key1 === "minValue")) || (key1 === "maxValue")) || (key1 === "minSelected")) || (key1 === "maxSelected"))){
const err11 = {instancePath:instancePath+"/validation",schemaPath:"#/definitions/Validation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data6.required !== undefined){
if(typeof data6.required !== "boolean"){
const err12 = {instancePath:instancePath+"/validation/required",schemaPath:"#/definitions/Validation/properties/required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data6.requiredAcceptsNull !== undefined){
if(typeof data6.requiredAcceptsNull !== "boolean"){
const err13 = {instancePath:instancePath+"/validation/requiredAcceptsNull",schemaPath:"#/definitions/Validation/properties/requiredAcceptsNull/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data6.minLength !== undefined){
let data9 = data6.minLength;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err14 = {instancePath:instancePath+"/validation/minLength",schemaPath:"#/definitions/Validation/properties/minLength/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data6.maxLength !== undefined){
let data10 = data6.maxLength;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err15 = {instancePath:instancePath+"/validation/maxLength",schemaPath:"#/definitions/Validation/properties/maxLength/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data6.minValue !== undefined){
let data11 = data6.minValue;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err16 = {instancePath:instancePath+"/validation/minValue",schemaPath:"#/definitions/Validation/properties/minValue/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data6.maxValue !== undefined){
let data12 = data6.maxValue;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err17 = {instancePath:instancePath+"/validation/maxValue",schemaPath:"#/definitions/Validation/properties/maxValue/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data6.minSelected !== undefined){
let data13 = data6.minSelected;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err18 = {instancePath:instancePath+"/validation/minSelected",schemaPath:"#/definitions/Validation/properties/minSelected/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data6.maxSelected !== undefined){
let data14 = data6.maxSelected;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err19 = {instancePath:instancePath+"/validation/maxSelected",schemaPath:"#/definitions/Validation/properties/maxSelected/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath:instancePath+"/validation",schemaPath:"#/definitions/Validation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
else {
const err21 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
validate183.errors = vErrors;
return errors === 0;
}


function validate182(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!(pattern0.test(key0))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
for(const key1 in data){
if(pattern0.test(key1)){
if(!(validate183(data[key1], {instancePath:instancePath+"/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),parentData:data,parentDataProperty:key1,rootData}))){
vErrors = vErrors === null ? validate183.errors : vErrors.concat(validate183.errors);
errors = vErrors.length;
}
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate182.errors = vErrors;
return errors === 0;
}


function validate181(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.color === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "color"},message:"must have required property '"+"color"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "name") || (key0 === "displayVariable")) || (key0 === "iconVariant")) || (key0 === "variables")) || (key0 === "color"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.name !== undefined){
if(typeof data.name !== "string"){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.displayVariable !== undefined){
if(typeof data.displayVariable !== "string"){
const err4 = {instancePath:instancePath+"/displayVariable",schemaPath:"#/properties/displayVariable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.iconVariant !== undefined){
if(typeof data.iconVariant !== "string"){
const err5 = {instancePath:instancePath+"/iconVariant",schemaPath:"#/properties/iconVariant/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.variables !== undefined){
if(!(validate182(data.variables, {instancePath:instancePath+"/variables",parentData:data,parentDataProperty:"variables",rootData}))){
vErrors = vErrors === null ? validate182.errors : vErrors.concat(validate182.errors);
errors = vErrors.length;
}
}
if(data.color !== undefined){
if(typeof data.color !== "string"){
const err6 = {instancePath:instancePath+"/color",schemaPath:"#/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate181.errors = vErrors;
return errors === 0;
}


function validate180(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!(pattern0.test(key0))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
for(const key1 in data){
if(pattern0.test(key1)){
if(!(validate181(data[key1], {instancePath:instancePath+"/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),parentData:data,parentDataProperty:key1,rootData}))){
vErrors = vErrors === null ? validate181.errors : vErrors.concat(validate181.errors);
errors = vErrors.length;
}
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate180.errors = vErrors;
return errors === 0;
}

const schema157 = {"type":"object","additionalProperties":false,"title":"Edge","patternProperties":{".+":{"$ref":"#/definitions/EdgeTypeDef"}}};
const schema158 = {"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"color":{"type":"string"},"variables":{"$ref":"#/definitions/Variables"}},"required":["name","color"],"title":"EdgeTypeDef"};

function validate193(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.color === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "color"},message:"must have required property '"+"color"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "name") || (key0 === "color")) || (key0 === "variables"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.name !== undefined){
if(typeof data.name !== "string"){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.color !== undefined){
if(typeof data.color !== "string"){
const err4 = {instancePath:instancePath+"/color",schemaPath:"#/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.variables !== undefined){
if(!(validate182(data.variables, {instancePath:instancePath+"/variables",parentData:data,parentDataProperty:"variables",rootData}))){
vErrors = vErrors === null ? validate182.errors : vErrors.concat(validate182.errors);
errors = vErrors.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
validate193.errors = vErrors;
return errors === 0;
}


function validate192(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!(pattern0.test(key0))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
for(const key1 in data){
if(pattern0.test(key1)){
if(!(validate193(data[key1], {instancePath:instancePath+"/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),parentData:data,parentDataProperty:key1,rootData}))){
vErrors = vErrors === null ? validate193.errors : vErrors.concat(validate193.errors);
errors = vErrors.length;
}
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate192.errors = vErrors;
return errors === 0;
}

const schema159 = {"type":"object","additionalProperties":false,"properties":{"variables":{"$ref":"#/definitions/Variables"}}};

function validate197(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!(key0 === "variables")){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.variables !== undefined){
if(!(validate182(data.variables, {instancePath:instancePath+"/variables",parentData:data,parentDataProperty:"variables",rootData}))){
vErrors = vErrors === null ? validate182.errors : vErrors.concat(validate182.errors);
errors = vErrors.length;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate197.errors = vErrors;
return errors === 0;
}


function validate179(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!(((key0 === "node") || (key0 === "edge")) || (key0 === "ego"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.node !== undefined){
if(!(validate180(data.node, {instancePath:instancePath+"/node",parentData:data,parentDataProperty:"node",rootData}))){
vErrors = vErrors === null ? validate180.errors : vErrors.concat(validate180.errors);
errors = vErrors.length;
}
}
if(data.edge !== undefined){
if(!(validate192(data.edge, {instancePath:instancePath+"/edge",parentData:data,parentDataProperty:"edge",rootData}))){
vErrors = vErrors === null ? validate192.errors : vErrors.concat(validate192.errors);
errors = vErrors.length;
}
}
if(data.ego !== undefined){
if(!(validate197(data.ego, {instancePath:instancePath+"/ego",parentData:data,parentDataProperty:"ego",rootData}))){
vErrors = vErrors === null ? validate197.errors : vErrors.concat(validate197.errors);
errors = vErrors.length;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate179.errors = vErrors;
return errors === 0;
}

const schema161 = {"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["Narrative","AlterForm","AlterEdgeForm","EgoForm","NameGenerator","NameGeneratorQuickAdd","NameGeneratorList","NameGeneratorAutoComplete","Sociogram","DyadCensus","Information","OrdinalBin","CategoricalBin"]},"label":{"type":"string"},"form":{"$ref":"#/definitions/Form"},"quickAdd":{"type":["string","null"]},"createEdge":{"type":"string"},"dataSource":{"type":["string","null"]},"subject":{"$ref":"#/definitions/Subject"},"panels":{"type":"array","items":{"$ref":"#/definitions/Panel"}},"prompts":{"type":"array","items":{"$ref":"#/definitions/Prompt"},"minItems":1},"presets":{"type":"array","items":{"$ref":"#/definitions/Preset"},"minItems":1},"background":{"type":"object","$ref":"#/definitions/Background","minProperties":1},"sortOptions":{"$ref":"#/definitions/SortOptions"},"cardOptions":{"type":"object","$ref":"#/definitions/CardOptions"},"searchOptions":{"type":"object","$ref":"#/definitions/SearchOptions"},"behaviours":{"type":"object","$ref":"#/definitions/Behaviours","minProperties":1},"showExistingNodes":{"type":"boolean"},"title":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/definitions/Item"}},"introductionPanel":{"$ref":"#/definitions/IntroductionPanel"},"skipLogic":{"$ref":"#/definitions/SkipLogic"},"filter":{"$ref":"#/definitions/Filter"}},"required":["id","label","type"],"title":"Interface","anyOf":[{"properties":{"type":{"const":"EgoForm"}},"required":["form","introductionPanel"]},{"properties":{"type":{"const":"DyadCensus"}},"required":["subject","introductionPanel"]},{"properties":{"type":{"const":"AlterForm"}},"required":["form","introductionPanel"]},{"properties":{"type":{"const":"AlterEdgeForm"}},"required":["form","introductionPanel"]},{"properties":{"type":{"const":"Information"}},"required":["items"]},{"properties":{"type":{"const":"Narrative"}},"required":["presets","background"]},{"properties":{"type":{"enum":["NameGenerator","NameGeneratorQuickAdd","NameGeneratorList","NameGeneratorAutoComplete","Sociogram","OrdinalBin","CategoricalBin","DyadCensus"]}},"required":["prompts"]}]};
const schema181 = {"type":"object","additionalProperties":false,"properties":{"image":{"type":"string"},"concentricCircles":{"type":"integer"},"skewedTowardCenter":{"type":"boolean"}},"title":"Background"};
const schema186 = {"type":"object","additionalProperties":false,"properties":{"fuzziness":{"type":"number"},"matchProperties":{"type":"array","items":{"type":"string"}}},"required":["fuzziness","matchProperties"],"title":"SearchOptions"};
const schema187 = {"type":"object","additionalProperties":false,"properties":{"freeDraw":{"type":"boolean"},"featureNode":{"type":"boolean"},"allowRepositioning":{"type":"boolean"}},"required":[],"title":"Behaviours"};
const schema188 = {"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["text","asset"]},"content":{"type":"string"},"description":{"type":"string"},"size":{"type":"string"},"loop":{"type":"boolean"}},"required":["content","id","type"],"title":"Item"};
const schema189 = {"type":"object","additionalProperties":false,"properties":{"title":{"type":"string"},"text":{"type":"string"}},"required":["title","text"]};
const func2 = Object.prototype.hasOwnProperty;
const schema162 = {"type":["object","null"],"additionalProperties":false,"properties":{"title":{"type":"string"},"fields":{"type":"array","items":{"$ref":"#/definitions/Field"}}},"required":["fields"],"title":"Form"};
const schema163 = {"type":"object","additionalProperties":false,"properties":{"variable":{"type":"string"},"prompt":{"type":"string"}},"required":["variable","prompt"],"title":"Field"};

function validate202(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if((!(data && typeof data == "object" && !Array.isArray(data))) && (data !== null)){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: schema162.type},message:"must be object,null"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.fields === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fields"},message:"must have required property '"+"fields"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "title") || (key0 === "fields"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.title !== undefined){
if(typeof data.title !== "string"){
const err3 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.fields !== undefined){
let data1 = data.fields;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.variable === undefined){
const err4 = {instancePath:instancePath+"/fields/" + i0,schemaPath:"#/definitions/Field/required",keyword:"required",params:{missingProperty: "variable"},message:"must have required property '"+"variable"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data2.prompt === undefined){
const err5 = {instancePath:instancePath+"/fields/" + i0,schemaPath:"#/definitions/Field/required",keyword:"required",params:{missingProperty: "prompt"},message:"must have required property '"+"prompt"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "variable") || (key1 === "prompt"))){
const err6 = {instancePath:instancePath+"/fields/" + i0,schemaPath:"#/definitions/Field/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data2.variable !== undefined){
if(typeof data2.variable !== "string"){
const err7 = {instancePath:instancePath+"/fields/" + i0+"/variable",schemaPath:"#/definitions/Field/properties/variable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data2.prompt !== undefined){
if(typeof data2.prompt !== "string"){
const err8 = {instancePath:instancePath+"/fields/" + i0+"/prompt",schemaPath:"#/definitions/Field/properties/prompt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath:instancePath+"/fields/" + i0,schemaPath:"#/definitions/Field/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath:instancePath+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
validate202.errors = vErrors;
return errors === 0;
}

const schema164 = {"type":"object","additionalProperties":false,"properties":{"entity":{"$ref":"#/definitions/Entity"},"type":{"type":"string"}},"required":["entity","type"],"title":"Subject"};
const schema165 = {"type":"string","enum":["edge","node","ego"],"title":"Entity"};

function validate204(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.entity === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entity"},message:"must have required property '"+"entity"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "entity") || (key0 === "type"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.entity !== undefined){
let data0 = data.entity;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/entity",schemaPath:"#/definitions/Entity/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(((data0 === "edge") || (data0 === "node")) || (data0 === "ego"))){
const err4 = {instancePath:instancePath+"/entity",schemaPath:"#/definitions/Entity/enum",keyword:"enum",params:{allowedValues: schema165.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.type !== undefined){
if(typeof data.type !== "string"){
const err5 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate204.errors = vErrors;
return errors === 0;
}

const schema166 = {"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"title":{"type":"string"},"filter":{"$ref":"#/definitions/Filter"},"dataSource":{"type":["string","null"]}},"required":["id","title","dataSource"],"title":"Panel"};
const schema167 = {"type":["object","null"],"additionalProperties":false,"properties":{"join":{"type":"string","enum":["OR","AND"]},"rules":{"type":"array","items":{"$ref":"#/definitions/Rule"}}},"title":"Filter"};
const schema168 = {"type":"object","additionalProperties":false,"properties":{"type":{"type":"string","enum":["alter","ego","edge"]},"id":{"type":"string"},"options":{"$ref":"#/definitions/Options"}},"required":["id","options","type"],"title":"Rule"};
const schema169 = {"type":"object","additionalProperties":false,"properties":{"type":{"type":"string"},"attribute":{"type":"string"},"operator":{"type":"string","enum":["EXISTS","NOT_EXISTS","EXACTLY","NOT","GREATER_THAN","GREATER_THAN_OR_EQUAL","LESS_THAN","LESS_THAN_OR_EQUAL","INCLUDES","EXCLUDES"]},"value":{"type":["integer","string","boolean"]}},"required":["operator"],"title":"Rule Options","allOf":[{"if":{"properties":{"operator":{"enum":["EXACTLY","NOT","GREATER_THAN","GREATER_THAN_OR_EQUAL","LESS_THAN","LESS_THAN_OR_EQUAL","INCLUDES","EXCLUDES"]}}},"then":{"required":["value"]}}]};

function validate208(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.options === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "options"},message:"must have required property '"+"options"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.type === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "type") || (key0 === "id")) || (key0 === "options"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!(((data0 === "alter") || (data0 === "ego")) || (data0 === "edge"))){
const err5 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema168.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.id !== undefined){
if(typeof data.id !== "string"){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.options !== undefined){
let data2 = data.options;
const _errs10 = errors;
let valid3 = true;
const _errs11 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.operator !== undefined){
let data3 = data2.operator;
if(!((((((((data3 === "EXACTLY") || (data3 === "NOT")) || (data3 === "GREATER_THAN")) || (data3 === "GREATER_THAN_OR_EQUAL")) || (data3 === "LESS_THAN")) || (data3 === "LESS_THAN_OR_EQUAL")) || (data3 === "INCLUDES")) || (data3 === "EXCLUDES"))){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
var _valid0 = _errs11 === errors;
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
if(_valid0){
const _errs13 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.value === undefined){
const err8 = {instancePath:instancePath+"/options",schemaPath:"#/definitions/Options/allOf/0/then/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
var _valid0 = _errs13 === errors;
valid3 = _valid0;
}
if(!valid3){
const err9 = {instancePath:instancePath+"/options",schemaPath:"#/definitions/Options/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.operator === undefined){
const err10 = {instancePath:instancePath+"/options",schemaPath:"#/definitions/Options/required",keyword:"required",params:{missingProperty: "operator"},message:"must have required property '"+"operator"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key1 in data2){
if(!((((key1 === "type") || (key1 === "attribute")) || (key1 === "operator")) || (key1 === "value"))){
const err11 = {instancePath:instancePath+"/options",schemaPath:"#/definitions/Options/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data2.type !== undefined){
if(typeof data2.type !== "string"){
const err12 = {instancePath:instancePath+"/options/type",schemaPath:"#/definitions/Options/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data2.attribute !== undefined){
if(typeof data2.attribute !== "string"){
const err13 = {instancePath:instancePath+"/options/attribute",schemaPath:"#/definitions/Options/properties/attribute/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data2.operator !== undefined){
let data6 = data2.operator;
if(typeof data6 !== "string"){
const err14 = {instancePath:instancePath+"/options/operator",schemaPath:"#/definitions/Options/properties/operator/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!((((((((((data6 === "EXISTS") || (data6 === "NOT_EXISTS")) || (data6 === "EXACTLY")) || (data6 === "NOT")) || (data6 === "GREATER_THAN")) || (data6 === "GREATER_THAN_OR_EQUAL")) || (data6 === "LESS_THAN")) || (data6 === "LESS_THAN_OR_EQUAL")) || (data6 === "INCLUDES")) || (data6 === "EXCLUDES"))){
const err15 = {instancePath:instancePath+"/options/operator",schemaPath:"#/definitions/Options/properties/operator/enum",keyword:"enum",params:{allowedValues: schema169.properties.operator.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data2.value !== undefined){
let data7 = data2.value;
if(((!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))) && (typeof data7 !== "string")) && (typeof data7 !== "boolean")){
const err16 = {instancePath:instancePath+"/options/value",schemaPath:"#/definitions/Options/properties/value/type",keyword:"type",params:{type: schema169.properties.value.type},message:"must be integer,string,boolean"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
else {
const err17 = {instancePath:instancePath+"/options",schemaPath:"#/definitions/Options/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate208.errors = vErrors;
return errors === 0;
}


function validate207(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if((!(data && typeof data == "object" && !Array.isArray(data))) && (data !== null)){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: schema167.type},message:"must be object,null"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!((key0 === "join") || (key0 === "rules"))){
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.join !== undefined){
let data0 = data.join;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/join",schemaPath:"#/properties/join/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(!((data0 === "OR") || (data0 === "AND"))){
const err3 = {instancePath:instancePath+"/join",schemaPath:"#/properties/join/enum",keyword:"enum",params:{allowedValues: schema167.properties.join.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.rules !== undefined){
let data1 = data.rules;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(validate208(data1[i0], {instancePath:instancePath+"/rules/" + i0,parentData:data1,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate208.errors : vErrors.concat(validate208.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath:instancePath+"/rules",schemaPath:"#/properties/rules/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
}
validate207.errors = vErrors;
return errors === 0;
}


function validate206(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.title === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.dataSource === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "dataSource"},message:"must have required property '"+"dataSource"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "id") || (key0 === "title")) || (key0 === "filter")) || (key0 === "dataSource"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined){
if(typeof data.id !== "string"){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.title !== undefined){
if(typeof data.title !== "string"){
const err5 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.filter !== undefined){
if(!(validate207(data.filter, {instancePath:instancePath+"/filter",parentData:data,parentDataProperty:"filter",rootData}))){
vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
errors = vErrors.length;
}
}
if(data.dataSource !== undefined){
let data3 = data.dataSource;
if((typeof data3 !== "string") && (data3 !== null)){
const err6 = {instancePath:instancePath+"/dataSource",schemaPath:"#/properties/dataSource/type",keyword:"type",params:{type: schema166.properties.dataSource.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate206.errors = vErrors;
return errors === 0;
}

const schema170 = {"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"text":{"type":"string"},"additionalAttributes":{"$ref":"#/definitions/AdditionalAttributes"},"variable":{"type":"string"},"otherVariable":{"type":"string"},"otherVariablePrompt":{"type":"string"},"otherOptionLabel":{"type":"string"},"bucketSortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"binSortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"sortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"color":{"type":"string"},"layout":{"$ref":"#/definitions/Layout"},"edges":{"$ref":"#/definitions/Edges"},"highlight":{"$ref":"#/definitions/Highlight"},"createEdge":{"type":"string"}},"required":["id","text"],"title":"Prompt"};
const schema175 = {"type":"object","additionalProperties":false,"properties":{"layoutVariable":{"type":"string"},"allowPositioning":{"type":"boolean"}},"required":["layoutVariable"],"title":"Layout"};
const schema176 = {"type":"object","additionalProperties":false,"properties":{"display":{"type":"array","items":{"type":"string"}},"create":{"type":"string"}},"required":[],"title":"Edges"};
const schema177 = {"type":"object","additionalProperties":false,"properties":{"variable":{"type":"string"},"allowHighlighting":{"type":"boolean"}},"required":["allowHighlighting"],"title":"Highlight"};
const schema171 = {"type":"array","title":"AdditionalAttributes","items":{"$ref":"#/definitions/AdditionalAttribute"}};
const schema172 = {"type":"object","additionalProperties":false,"properties":{"variable":{"type":"string"},"value":{"type":["boolean"]}},"required":["variable","value"],"title":"AdditionalAttribute"};

function validate213(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(Array.isArray(data)){
const len0 = data.length;
for(let i0=0; i0<len0; i0++){
let data0 = data[i0];
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.variable === undefined){
const err0 = {instancePath:instancePath+"/" + i0,schemaPath:"#/definitions/AdditionalAttribute/required",keyword:"required",params:{missingProperty: "variable"},message:"must have required property '"+"variable"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data0.value === undefined){
const err1 = {instancePath:instancePath+"/" + i0,schemaPath:"#/definitions/AdditionalAttribute/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data0){
if(!((key0 === "variable") || (key0 === "value"))){
const err2 = {instancePath:instancePath+"/" + i0,schemaPath:"#/definitions/AdditionalAttribute/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data0.variable !== undefined){
if(typeof data0.variable !== "string"){
const err3 = {instancePath:instancePath+"/" + i0+"/variable",schemaPath:"#/definitions/AdditionalAttribute/properties/variable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data0.value !== undefined){
if(typeof data0.value !== "boolean"){
const err4 = {instancePath:instancePath+"/" + i0+"/value",schemaPath:"#/definitions/AdditionalAttribute/properties/value/type",keyword:"type",params:{type: schema172.properties.value.type},message:"must be boolean"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
}
else {
const err5 = {instancePath:instancePath+"/" + i0,schemaPath:"#/definitions/AdditionalAttribute/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate213.errors = vErrors;
return errors === 0;
}

const schema173 = {"type":"object","additionalProperties":false,"properties":{"property":{"type":"string"},"direction":{"$ref":"#/definitions/Direction"}},"required":["direction","property"],"title":"SortOrder"};
const schema174 = {"type":"string","enum":["desc","asc"],"title":"Direction"};

function validate215(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.direction === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "direction"},message:"must have required property '"+"direction"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.property === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "property"},message:"must have required property '"+"property"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "property") || (key0 === "direction"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.property !== undefined){
if(typeof data.property !== "string"){
const err3 = {instancePath:instancePath+"/property",schemaPath:"#/properties/property/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.direction !== undefined){
let data1 = data.direction;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/direction",schemaPath:"#/definitions/Direction/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!((data1 === "desc") || (data1 === "asc"))){
const err5 = {instancePath:instancePath+"/direction",schemaPath:"#/definitions/Direction/enum",keyword:"enum",params:{allowedValues: schema174.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate215.errors = vErrors;
return errors === 0;
}


function validate212(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.text === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "text"},message:"must have required property '"+"text"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema170.properties, key0))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.id !== undefined){
if(typeof data.id !== "string"){
const err3 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.text !== undefined){
if(typeof data.text !== "string"){
const err4 = {instancePath:instancePath+"/text",schemaPath:"#/properties/text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.additionalAttributes !== undefined){
if(!(validate213(data.additionalAttributes, {instancePath:instancePath+"/additionalAttributes",parentData:data,parentDataProperty:"additionalAttributes",rootData}))){
vErrors = vErrors === null ? validate213.errors : vErrors.concat(validate213.errors);
errors = vErrors.length;
}
}
if(data.variable !== undefined){
if(typeof data.variable !== "string"){
const err5 = {instancePath:instancePath+"/variable",schemaPath:"#/properties/variable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.otherVariable !== undefined){
if(typeof data.otherVariable !== "string"){
const err6 = {instancePath:instancePath+"/otherVariable",schemaPath:"#/properties/otherVariable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.otherVariablePrompt !== undefined){
if(typeof data.otherVariablePrompt !== "string"){
const err7 = {instancePath:instancePath+"/otherVariablePrompt",schemaPath:"#/properties/otherVariablePrompt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.otherOptionLabel !== undefined){
if(typeof data.otherOptionLabel !== "string"){
const err8 = {instancePath:instancePath+"/otherOptionLabel",schemaPath:"#/properties/otherOptionLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.bucketSortOrder !== undefined){
let data7 = data.bucketSortOrder;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate215(data7[i0], {instancePath:instancePath+"/bucketSortOrder/" + i0,parentData:data7,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath:instancePath+"/bucketSortOrder",schemaPath:"#/properties/bucketSortOrder/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.binSortOrder !== undefined){
let data9 = data.binSortOrder;
if(Array.isArray(data9)){
const len1 = data9.length;
for(let i1=0; i1<len1; i1++){
if(!(validate215(data9[i1], {instancePath:instancePath+"/binSortOrder/" + i1,parentData:data9,parentDataProperty:i1,rootData}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/binSortOrder",schemaPath:"#/properties/binSortOrder/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.sortOrder !== undefined){
let data11 = data.sortOrder;
if(Array.isArray(data11)){
const len2 = data11.length;
for(let i2=0; i2<len2; i2++){
if(!(validate215(data11[i2], {instancePath:instancePath+"/sortOrder/" + i2,parentData:data11,parentDataProperty:i2,rootData}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/sortOrder",schemaPath:"#/properties/sortOrder/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.color !== undefined){
if(typeof data.color !== "string"){
const err12 = {instancePath:instancePath+"/color",schemaPath:"#/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.layout !== undefined){
let data14 = data.layout;
if(data14 && typeof data14 == "object" && !Array.isArray(data14)){
if(data14.layoutVariable === undefined){
const err13 = {instancePath:instancePath+"/layout",schemaPath:"#/definitions/Layout/required",keyword:"required",params:{missingProperty: "layoutVariable"},message:"must have required property '"+"layoutVariable"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data14){
if(!((key1 === "layoutVariable") || (key1 === "allowPositioning"))){
const err14 = {instancePath:instancePath+"/layout",schemaPath:"#/definitions/Layout/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data14.layoutVariable !== undefined){
if(typeof data14.layoutVariable !== "string"){
const err15 = {instancePath:instancePath+"/layout/layoutVariable",schemaPath:"#/definitions/Layout/properties/layoutVariable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data14.allowPositioning !== undefined){
if(typeof data14.allowPositioning !== "boolean"){
const err16 = {instancePath:instancePath+"/layout/allowPositioning",schemaPath:"#/definitions/Layout/properties/allowPositioning/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
else {
const err17 = {instancePath:instancePath+"/layout",schemaPath:"#/definitions/Layout/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.edges !== undefined){
let data17 = data.edges;
if(data17 && typeof data17 == "object" && !Array.isArray(data17)){
for(const key2 in data17){
if(!((key2 === "display") || (key2 === "create"))){
const err18 = {instancePath:instancePath+"/edges",schemaPath:"#/definitions/Edges/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data17.display !== undefined){
let data18 = data17.display;
if(Array.isArray(data18)){
const len3 = data18.length;
for(let i3=0; i3<len3; i3++){
if(typeof data18[i3] !== "string"){
const err19 = {instancePath:instancePath+"/edges/display/" + i3,schemaPath:"#/definitions/Edges/properties/display/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath:instancePath+"/edges/display",schemaPath:"#/definitions/Edges/properties/display/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data17.create !== undefined){
if(typeof data17.create !== "string"){
const err21 = {instancePath:instancePath+"/edges/create",schemaPath:"#/definitions/Edges/properties/create/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath:instancePath+"/edges",schemaPath:"#/definitions/Edges/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.highlight !== undefined){
let data21 = data.highlight;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.allowHighlighting === undefined){
const err23 = {instancePath:instancePath+"/highlight",schemaPath:"#/definitions/Highlight/required",keyword:"required",params:{missingProperty: "allowHighlighting"},message:"must have required property '"+"allowHighlighting"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
for(const key3 in data21){
if(!((key3 === "variable") || (key3 === "allowHighlighting"))){
const err24 = {instancePath:instancePath+"/highlight",schemaPath:"#/definitions/Highlight/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data21.variable !== undefined){
if(typeof data21.variable !== "string"){
const err25 = {instancePath:instancePath+"/highlight/variable",schemaPath:"#/definitions/Highlight/properties/variable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data21.allowHighlighting !== undefined){
if(typeof data21.allowHighlighting !== "boolean"){
const err26 = {instancePath:instancePath+"/highlight/allowHighlighting",schemaPath:"#/definitions/Highlight/properties/allowHighlighting/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath:instancePath+"/highlight",schemaPath:"#/definitions/Highlight/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.createEdge !== undefined){
if(typeof data.createEdge !== "string"){
const err28 = {instancePath:instancePath+"/createEdge",schemaPath:"#/properties/createEdge/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
else {
const err29 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
validate212.errors = vErrors;
return errors === 0;
}

const schema178 = {"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"label":{"type":"string"},"layoutVariable":{"type":"string"},"groupVariable":{"type":"string"},"edges":{"$ref":"#/definitions/Edges"},"highlight":{"$ref":"#/definitions/NarrativeHighlight"}},"required":["id","label","layoutVariable"],"title":"Preset"};
const schema180 = {"type":"array","items":{"type":"string"},"title":"NarrativeHighlight"};

function validate220(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.label === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "label"},message:"must have required property '"+"label"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.layoutVariable === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "layoutVariable"},message:"must have required property '"+"layoutVariable"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "id") || (key0 === "label")) || (key0 === "layoutVariable")) || (key0 === "groupVariable")) || (key0 === "edges")) || (key0 === "highlight"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined){
if(typeof data.id !== "string"){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.label !== undefined){
if(typeof data.label !== "string"){
const err5 = {instancePath:instancePath+"/label",schemaPath:"#/properties/label/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.layoutVariable !== undefined){
if(typeof data.layoutVariable !== "string"){
const err6 = {instancePath:instancePath+"/layoutVariable",schemaPath:"#/properties/layoutVariable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.groupVariable !== undefined){
if(typeof data.groupVariable !== "string"){
const err7 = {instancePath:instancePath+"/groupVariable",schemaPath:"#/properties/groupVariable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.edges !== undefined){
let data4 = data.edges;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
for(const key1 in data4){
if(!((key1 === "display") || (key1 === "create"))){
const err8 = {instancePath:instancePath+"/edges",schemaPath:"#/definitions/Edges/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data4.display !== undefined){
let data5 = data4.display;
if(Array.isArray(data5)){
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
if(typeof data5[i0] !== "string"){
const err9 = {instancePath:instancePath+"/edges/display/" + i0,schemaPath:"#/definitions/Edges/properties/display/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath:instancePath+"/edges/display",schemaPath:"#/definitions/Edges/properties/display/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data4.create !== undefined){
if(typeof data4.create !== "string"){
const err11 = {instancePath:instancePath+"/edges/create",schemaPath:"#/definitions/Edges/properties/create/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath:instancePath+"/edges",schemaPath:"#/definitions/Edges/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.highlight !== undefined){
let data8 = data.highlight;
if(Array.isArray(data8)){
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
if(typeof data8[i1] !== "string"){
const err13 = {instancePath:instancePath+"/highlight/" + i1,schemaPath:"#/definitions/NarrativeHighlight/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath:instancePath+"/highlight",schemaPath:"#/definitions/NarrativeHighlight/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate220.errors = vErrors;
return errors === 0;
}

const schema182 = {"type":"object","additionalProperties":false,"properties":{"sortOrder":{"type":"array","items":{"$ref":"#/definitions/SortOrder"}},"sortableProperties":{"type":"array","items":{"$ref":"#/definitions/Property"}}},"required":["sortOrder","sortableProperties"],"title":"SortOptions"};
const schema183 = {"type":"object","additionalProperties":false,"properties":{"label":{"type":"string"},"variable":{"type":"string"}},"required":["label","variable"],"title":"Property"};

function validate222(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.sortOrder === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sortOrder"},message:"must have required property '"+"sortOrder"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.sortableProperties === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sortableProperties"},message:"must have required property '"+"sortableProperties"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "sortOrder") || (key0 === "sortableProperties"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.sortOrder !== undefined){
let data0 = data.sortOrder;
if(Array.isArray(data0)){
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
if(!(validate215(data0[i0], {instancePath:instancePath+"/sortOrder/" + i0,parentData:data0,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath:instancePath+"/sortOrder",schemaPath:"#/properties/sortOrder/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.sortableProperties !== undefined){
let data2 = data.sortableProperties;
if(Array.isArray(data2)){
const len1 = data2.length;
for(let i1=0; i1<len1; i1++){
let data3 = data2[i1];
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.label === undefined){
const err4 = {instancePath:instancePath+"/sortableProperties/" + i1,schemaPath:"#/definitions/Property/required",keyword:"required",params:{missingProperty: "label"},message:"must have required property '"+"label"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data3.variable === undefined){
const err5 = {instancePath:instancePath+"/sortableProperties/" + i1,schemaPath:"#/definitions/Property/required",keyword:"required",params:{missingProperty: "variable"},message:"must have required property '"+"variable"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "label") || (key1 === "variable"))){
const err6 = {instancePath:instancePath+"/sortableProperties/" + i1,schemaPath:"#/definitions/Property/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data3.label !== undefined){
if(typeof data3.label !== "string"){
const err7 = {instancePath:instancePath+"/sortableProperties/" + i1+"/label",schemaPath:"#/definitions/Property/properties/label/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data3.variable !== undefined){
if(typeof data3.variable !== "string"){
const err8 = {instancePath:instancePath+"/sortableProperties/" + i1+"/variable",schemaPath:"#/definitions/Property/properties/variable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath:instancePath+"/sortableProperties/" + i1,schemaPath:"#/definitions/Property/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath:instancePath+"/sortableProperties",schemaPath:"#/properties/sortableProperties/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate222.errors = vErrors;
return errors === 0;
}

const schema184 = {"type":"object","additionalProperties":false,"properties":{"displayLabel":{"type":"string"},"additionalProperties":{"type":"array","items":{"$ref":"#/definitions/Property"}}},"title":"CardOptions"};

function validate225(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!((key0 === "displayLabel") || (key0 === "additionalProperties"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.displayLabel !== undefined){
if(typeof data.displayLabel !== "string"){
const err1 = {instancePath:instancePath+"/displayLabel",schemaPath:"#/properties/displayLabel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.additionalProperties !== undefined){
let data1 = data.additionalProperties;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.label === undefined){
const err2 = {instancePath:instancePath+"/additionalProperties/" + i0,schemaPath:"#/definitions/Property/required",keyword:"required",params:{missingProperty: "label"},message:"must have required property '"+"label"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data2.variable === undefined){
const err3 = {instancePath:instancePath+"/additionalProperties/" + i0,schemaPath:"#/definitions/Property/required",keyword:"required",params:{missingProperty: "variable"},message:"must have required property '"+"variable"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "label") || (key1 === "variable"))){
const err4 = {instancePath:instancePath+"/additionalProperties/" + i0,schemaPath:"#/definitions/Property/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data2.label !== undefined){
if(typeof data2.label !== "string"){
const err5 = {instancePath:instancePath+"/additionalProperties/" + i0+"/label",schemaPath:"#/definitions/Property/properties/label/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data2.variable !== undefined){
if(typeof data2.variable !== "string"){
const err6 = {instancePath:instancePath+"/additionalProperties/" + i0+"/variable",schemaPath:"#/definitions/Property/properties/variable/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
else {
const err7 = {instancePath:instancePath+"/additionalProperties/" + i0,schemaPath:"#/definitions/Property/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath:instancePath+"/additionalProperties",schemaPath:"#/properties/additionalProperties/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate225.errors = vErrors;
return errors === 0;
}

const schema190 = {"type":"object","additionalProperties":false,"properties":{"action":{"type":"string","enum":["SHOW","SKIP"]},"filter":{"$ref":"#/definitions/Filter"}},"required":["action","filter"],"title":"SkipLogic"};

function validate227(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.action === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "action"},message:"must have required property '"+"action"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.filter === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filter"},message:"must have required property '"+"filter"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "action") || (key0 === "filter"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.action !== undefined){
let data0 = data.action;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/action",schemaPath:"#/properties/action/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!((data0 === "SHOW") || (data0 === "SKIP"))){
const err4 = {instancePath:instancePath+"/action",schemaPath:"#/properties/action/enum",keyword:"enum",params:{allowedValues: schema190.properties.action.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.filter !== undefined){
if(!(validate207(data.filter, {instancePath:instancePath+"/filter",parentData:data,parentDataProperty:"filter",rootData}))){
vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
errors = vErrors.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
validate227.errors = vErrors;
return errors === 0;
}


function validate201(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
const _errs1 = errors;
let valid0 = false;
const _errs2 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.form === undefined){
const err0 = {instancePath,schemaPath:"#/anyOf/0/required",keyword:"required",params:{missingProperty: "form"},message:"must have required property '"+"form"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.introductionPanel === undefined){
const err1 = {instancePath,schemaPath:"#/anyOf/0/required",keyword:"required",params:{missingProperty: "introductionPanel"},message:"must have required property '"+"introductionPanel"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.type !== undefined){
if("EgoForm" !== data.type){
const err2 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/0/properties/type/const",keyword:"const",params:{allowedValue: "EgoForm"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
var _valid0 = _errs2 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs4 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.subject === undefined){
const err3 = {instancePath,schemaPath:"#/anyOf/1/required",keyword:"required",params:{missingProperty: "subject"},message:"must have required property '"+"subject"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.introductionPanel === undefined){
const err4 = {instancePath,schemaPath:"#/anyOf/1/required",keyword:"required",params:{missingProperty: "introductionPanel"},message:"must have required property '"+"introductionPanel"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.type !== undefined){
if("DyadCensus" !== data.type){
const err5 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/1/properties/type/const",keyword:"const",params:{allowedValue: "DyadCensus"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
var _valid0 = _errs4 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.form === undefined){
const err6 = {instancePath,schemaPath:"#/anyOf/2/required",keyword:"required",params:{missingProperty: "form"},message:"must have required property '"+"form"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.introductionPanel === undefined){
const err7 = {instancePath,schemaPath:"#/anyOf/2/required",keyword:"required",params:{missingProperty: "introductionPanel"},message:"must have required property '"+"introductionPanel"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.type !== undefined){
if("AlterForm" !== data.type){
const err8 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/2/properties/type/const",keyword:"const",params:{allowedValue: "AlterForm"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
var _valid0 = _errs6 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.form === undefined){
const err9 = {instancePath,schemaPath:"#/anyOf/3/required",keyword:"required",params:{missingProperty: "form"},message:"must have required property '"+"form"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.introductionPanel === undefined){
const err10 = {instancePath,schemaPath:"#/anyOf/3/required",keyword:"required",params:{missingProperty: "introductionPanel"},message:"must have required property '"+"introductionPanel"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.type !== undefined){
if("AlterEdgeForm" !== data.type){
const err11 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/3/properties/type/const",keyword:"const",params:{allowedValue: "AlterEdgeForm"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
var _valid0 = _errs8 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.items === undefined){
const err12 = {instancePath,schemaPath:"#/anyOf/4/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.type !== undefined){
if("Information" !== data.type){
const err13 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/4/properties/type/const",keyword:"const",params:{allowedValue: "Information"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
var _valid0 = _errs10 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.presets === undefined){
const err14 = {instancePath,schemaPath:"#/anyOf/5/required",keyword:"required",params:{missingProperty: "presets"},message:"must have required property '"+"presets"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.background === undefined){
const err15 = {instancePath,schemaPath:"#/anyOf/5/required",keyword:"required",params:{missingProperty: "background"},message:"must have required property '"+"background"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.type !== undefined){
if("Narrative" !== data.type){
const err16 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/5/properties/type/const",keyword:"const",params:{allowedValue: "Narrative"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
var _valid0 = _errs12 === errors;
valid0 = valid0 || _valid0;
if(!valid0){
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.prompts === undefined){
const err17 = {instancePath,schemaPath:"#/anyOf/6/required",keyword:"required",params:{missingProperty: "prompts"},message:"must have required property '"+"prompts"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.type !== undefined){
let data6 = data.type;
if(!((((((((data6 === "NameGenerator") || (data6 === "NameGeneratorQuickAdd")) || (data6 === "NameGeneratorList")) || (data6 === "NameGeneratorAutoComplete")) || (data6 === "Sociogram")) || (data6 === "OrdinalBin")) || (data6 === "CategoricalBin")) || (data6 === "DyadCensus"))){
const err18 = {instancePath:instancePath+"/type",schemaPath:"#/anyOf/6/properties/type/enum",keyword:"enum",params:{allowedValues: schema161.anyOf[6].properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
var _valid0 = _errs14 === errors;
valid0 = valid0 || _valid0;
}
}
}
}
}
}
if(!valid0){
const err19 = {instancePath,schemaPath:"#/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
errors = _errs1;
if(vErrors !== null){
if(_errs1){
vErrors.length = _errs1;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.label === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "label"},message:"must have required property '"+"label"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.type === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema161.properties, key0))){
const err23 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.id !== undefined){
if(typeof data.id !== "string"){
const err24 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.type !== undefined){
let data8 = data.type;
if(typeof data8 !== "string"){
const err25 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(((((((((((((data8 === "Narrative") || (data8 === "AlterForm")) || (data8 === "AlterEdgeForm")) || (data8 === "EgoForm")) || (data8 === "NameGenerator")) || (data8 === "NameGeneratorQuickAdd")) || (data8 === "NameGeneratorList")) || (data8 === "NameGeneratorAutoComplete")) || (data8 === "Sociogram")) || (data8 === "DyadCensus")) || (data8 === "Information")) || (data8 === "OrdinalBin")) || (data8 === "CategoricalBin"))){
const err26 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema161.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.label !== undefined){
if(typeof data.label !== "string"){
const err27 = {instancePath:instancePath+"/label",schemaPath:"#/properties/label/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.form !== undefined){
if(!(validate202(data.form, {instancePath:instancePath+"/form",parentData:data,parentDataProperty:"form",rootData}))){
vErrors = vErrors === null ? validate202.errors : vErrors.concat(validate202.errors);
errors = vErrors.length;
}
}
if(data.quickAdd !== undefined){
let data11 = data.quickAdd;
if((typeof data11 !== "string") && (data11 !== null)){
const err28 = {instancePath:instancePath+"/quickAdd",schemaPath:"#/properties/quickAdd/type",keyword:"type",params:{type: schema161.properties.quickAdd.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.createEdge !== undefined){
if(typeof data.createEdge !== "string"){
const err29 = {instancePath:instancePath+"/createEdge",schemaPath:"#/properties/createEdge/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.dataSource !== undefined){
let data13 = data.dataSource;
if((typeof data13 !== "string") && (data13 !== null)){
const err30 = {instancePath:instancePath+"/dataSource",schemaPath:"#/properties/dataSource/type",keyword:"type",params:{type: schema161.properties.dataSource.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.subject !== undefined){
if(!(validate204(data.subject, {instancePath:instancePath+"/subject",parentData:data,parentDataProperty:"subject",rootData}))){
vErrors = vErrors === null ? validate204.errors : vErrors.concat(validate204.errors);
errors = vErrors.length;
}
}
if(data.panels !== undefined){
let data15 = data.panels;
if(Array.isArray(data15)){
const len0 = data15.length;
for(let i0=0; i0<len0; i0++){
if(!(validate206(data15[i0], {instancePath:instancePath+"/panels/" + i0,parentData:data15,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate206.errors : vErrors.concat(validate206.errors);
errors = vErrors.length;
}
}
}
else {
const err31 = {instancePath:instancePath+"/panels",schemaPath:"#/properties/panels/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.prompts !== undefined){
let data17 = data.prompts;
if(Array.isArray(data17)){
if(data17.length < 1){
const err32 = {instancePath:instancePath+"/prompts",schemaPath:"#/properties/prompts/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
const len1 = data17.length;
for(let i1=0; i1<len1; i1++){
if(!(validate212(data17[i1], {instancePath:instancePath+"/prompts/" + i1,parentData:data17,parentDataProperty:i1,rootData}))){
vErrors = vErrors === null ? validate212.errors : vErrors.concat(validate212.errors);
errors = vErrors.length;
}
}
}
else {
const err33 = {instancePath:instancePath+"/prompts",schemaPath:"#/properties/prompts/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.presets !== undefined){
let data19 = data.presets;
if(Array.isArray(data19)){
if(data19.length < 1){
const err34 = {instancePath:instancePath+"/presets",schemaPath:"#/properties/presets/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
const len2 = data19.length;
for(let i2=0; i2<len2; i2++){
if(!(validate220(data19[i2], {instancePath:instancePath+"/presets/" + i2,parentData:data19,parentDataProperty:i2,rootData}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
}
else {
const err35 = {instancePath:instancePath+"/presets",schemaPath:"#/properties/presets/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.background !== undefined){
let data21 = data.background;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
for(const key1 in data21){
if(!(((key1 === "image") || (key1 === "concentricCircles")) || (key1 === "skewedTowardCenter"))){
const err36 = {instancePath:instancePath+"/background",schemaPath:"#/definitions/Background/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data21.image !== undefined){
if(typeof data21.image !== "string"){
const err37 = {instancePath:instancePath+"/background/image",schemaPath:"#/definitions/Background/properties/image/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data21.concentricCircles !== undefined){
let data23 = data21.concentricCircles;
if(!(((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23))) && (isFinite(data23)))){
const err38 = {instancePath:instancePath+"/background/concentricCircles",schemaPath:"#/definitions/Background/properties/concentricCircles/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data21.skewedTowardCenter !== undefined){
if(typeof data21.skewedTowardCenter !== "boolean"){
const err39 = {instancePath:instancePath+"/background/skewedTowardCenter",schemaPath:"#/definitions/Background/properties/skewedTowardCenter/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath:instancePath+"/background",schemaPath:"#/definitions/Background/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(Object.keys(data21).length < 1){
const err41 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/minProperties",keyword:"minProperties",params:{limit: 1},message:"must NOT have fewer than 1 properties"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
else {
const err42 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.sortOptions !== undefined){
if(!(validate222(data.sortOptions, {instancePath:instancePath+"/sortOptions",parentData:data,parentDataProperty:"sortOptions",rootData}))){
vErrors = vErrors === null ? validate222.errors : vErrors.concat(validate222.errors);
errors = vErrors.length;
}
}
if(data.cardOptions !== undefined){
let data26 = data.cardOptions;
if(!(data26 && typeof data26 == "object" && !Array.isArray(data26))){
const err43 = {instancePath:instancePath+"/cardOptions",schemaPath:"#/properties/cardOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(!(validate225(data26, {instancePath:instancePath+"/cardOptions",parentData:data,parentDataProperty:"cardOptions",rootData}))){
vErrors = vErrors === null ? validate225.errors : vErrors.concat(validate225.errors);
errors = vErrors.length;
}
}
if(data.searchOptions !== undefined){
let data27 = data.searchOptions;
if(!(data27 && typeof data27 == "object" && !Array.isArray(data27))){
const err44 = {instancePath:instancePath+"/searchOptions",schemaPath:"#/properties/searchOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data27 && typeof data27 == "object" && !Array.isArray(data27)){
if(data27.fuzziness === undefined){
const err45 = {instancePath:instancePath+"/searchOptions",schemaPath:"#/definitions/SearchOptions/required",keyword:"required",params:{missingProperty: "fuzziness"},message:"must have required property '"+"fuzziness"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data27.matchProperties === undefined){
const err46 = {instancePath:instancePath+"/searchOptions",schemaPath:"#/definitions/SearchOptions/required",keyword:"required",params:{missingProperty: "matchProperties"},message:"must have required property '"+"matchProperties"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key2 in data27){
if(!((key2 === "fuzziness") || (key2 === "matchProperties"))){
const err47 = {instancePath:instancePath+"/searchOptions",schemaPath:"#/definitions/SearchOptions/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data27.fuzziness !== undefined){
let data28 = data27.fuzziness;
if(!((typeof data28 == "number") && (isFinite(data28)))){
const err48 = {instancePath:instancePath+"/searchOptions/fuzziness",schemaPath:"#/definitions/SearchOptions/properties/fuzziness/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data27.matchProperties !== undefined){
let data29 = data27.matchProperties;
if(Array.isArray(data29)){
const len3 = data29.length;
for(let i3=0; i3<len3; i3++){
if(typeof data29[i3] !== "string"){
const err49 = {instancePath:instancePath+"/searchOptions/matchProperties/" + i3,schemaPath:"#/definitions/SearchOptions/properties/matchProperties/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
else {
const err50 = {instancePath:instancePath+"/searchOptions/matchProperties",schemaPath:"#/definitions/SearchOptions/properties/matchProperties/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
else {
const err51 = {instancePath:instancePath+"/searchOptions",schemaPath:"#/definitions/SearchOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.behaviours !== undefined){
let data31 = data.behaviours;
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
for(const key3 in data31){
if(!(((key3 === "freeDraw") || (key3 === "featureNode")) || (key3 === "allowRepositioning"))){
const err52 = {instancePath:instancePath+"/behaviours",schemaPath:"#/definitions/Behaviours/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data31.freeDraw !== undefined){
if(typeof data31.freeDraw !== "boolean"){
const err53 = {instancePath:instancePath+"/behaviours/freeDraw",schemaPath:"#/definitions/Behaviours/properties/freeDraw/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data31.featureNode !== undefined){
if(typeof data31.featureNode !== "boolean"){
const err54 = {instancePath:instancePath+"/behaviours/featureNode",schemaPath:"#/definitions/Behaviours/properties/featureNode/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data31.allowRepositioning !== undefined){
if(typeof data31.allowRepositioning !== "boolean"){
const err55 = {instancePath:instancePath+"/behaviours/allowRepositioning",schemaPath:"#/definitions/Behaviours/properties/allowRepositioning/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
else {
const err56 = {instancePath:instancePath+"/behaviours",schemaPath:"#/definitions/Behaviours/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
if(Object.keys(data31).length < 1){
const err57 = {instancePath:instancePath+"/behaviours",schemaPath:"#/properties/behaviours/minProperties",keyword:"minProperties",params:{limit: 1},message:"must NOT have fewer than 1 properties"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
else {
const err58 = {instancePath:instancePath+"/behaviours",schemaPath:"#/properties/behaviours/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.showExistingNodes !== undefined){
if(typeof data.showExistingNodes !== "boolean"){
const err59 = {instancePath:instancePath+"/showExistingNodes",schemaPath:"#/properties/showExistingNodes/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data.title !== undefined){
if(typeof data.title !== "string"){
const err60 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data.items !== undefined){
let data37 = data.items;
if(Array.isArray(data37)){
const len4 = data37.length;
for(let i4=0; i4<len4; i4++){
let data38 = data37[i4];
if(data38 && typeof data38 == "object" && !Array.isArray(data38)){
if(data38.content === undefined){
const err61 = {instancePath:instancePath+"/items/" + i4,schemaPath:"#/definitions/Item/required",keyword:"required",params:{missingProperty: "content"},message:"must have required property '"+"content"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data38.id === undefined){
const err62 = {instancePath:instancePath+"/items/" + i4,schemaPath:"#/definitions/Item/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data38.type === undefined){
const err63 = {instancePath:instancePath+"/items/" + i4,schemaPath:"#/definitions/Item/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
for(const key4 in data38){
if(!((((((key4 === "id") || (key4 === "type")) || (key4 === "content")) || (key4 === "description")) || (key4 === "size")) || (key4 === "loop"))){
const err64 = {instancePath:instancePath+"/items/" + i4,schemaPath:"#/definitions/Item/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data38.id !== undefined){
if(typeof data38.id !== "string"){
const err65 = {instancePath:instancePath+"/items/" + i4+"/id",schemaPath:"#/definitions/Item/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data38.type !== undefined){
let data40 = data38.type;
if(typeof data40 !== "string"){
const err66 = {instancePath:instancePath+"/items/" + i4+"/type",schemaPath:"#/definitions/Item/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(!((data40 === "text") || (data40 === "asset"))){
const err67 = {instancePath:instancePath+"/items/" + i4+"/type",schemaPath:"#/definitions/Item/properties/type/enum",keyword:"enum",params:{allowedValues: schema188.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data38.content !== undefined){
if(typeof data38.content !== "string"){
const err68 = {instancePath:instancePath+"/items/" + i4+"/content",schemaPath:"#/definitions/Item/properties/content/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data38.description !== undefined){
if(typeof data38.description !== "string"){
const err69 = {instancePath:instancePath+"/items/" + i4+"/description",schemaPath:"#/definitions/Item/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data38.size !== undefined){
if(typeof data38.size !== "string"){
const err70 = {instancePath:instancePath+"/items/" + i4+"/size",schemaPath:"#/definitions/Item/properties/size/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data38.loop !== undefined){
if(typeof data38.loop !== "boolean"){
const err71 = {instancePath:instancePath+"/items/" + i4+"/loop",schemaPath:"#/definitions/Item/properties/loop/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
}
else {
const err72 = {instancePath:instancePath+"/items/" + i4,schemaPath:"#/definitions/Item/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
else {
const err73 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data.introductionPanel !== undefined){
let data45 = data.introductionPanel;
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
if(data45.title === undefined){
const err74 = {instancePath:instancePath+"/introductionPanel",schemaPath:"#/definitions/IntroductionPanel/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data45.text === undefined){
const err75 = {instancePath:instancePath+"/introductionPanel",schemaPath:"#/definitions/IntroductionPanel/required",keyword:"required",params:{missingProperty: "text"},message:"must have required property '"+"text"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key5 in data45){
if(!((key5 === "title") || (key5 === "text"))){
const err76 = {instancePath:instancePath+"/introductionPanel",schemaPath:"#/definitions/IntroductionPanel/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data45.title !== undefined){
if(typeof data45.title !== "string"){
const err77 = {instancePath:instancePath+"/introductionPanel/title",schemaPath:"#/definitions/IntroductionPanel/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data45.text !== undefined){
if(typeof data45.text !== "string"){
const err78 = {instancePath:instancePath+"/introductionPanel/text",schemaPath:"#/definitions/IntroductionPanel/properties/text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
}
else {
const err79 = {instancePath:instancePath+"/introductionPanel",schemaPath:"#/definitions/IntroductionPanel/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data.skipLogic !== undefined){
if(!(validate227(data.skipLogic, {instancePath:instancePath+"/skipLogic",parentData:data,parentDataProperty:"skipLogic",rootData}))){
vErrors = vErrors === null ? validate227.errors : vErrors.concat(validate227.errors);
errors = vErrors.length;
}
}
if(data.filter !== undefined){
if(!(validate207(data.filter, {instancePath:instancePath+"/filter",parentData:data,parentDataProperty:"filter",rootData}))){
vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
errors = vErrors.length;
}
}
}
else {
const err80 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
validate201.errors = vErrors;
return errors === 0;
}


function validate178(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.stages === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stages"},message:"must have required property '"+"stages"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.codebook === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "codebook"},message:"must have required property '"+"codebook"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "name") || (key0 === "description")) || (key0 === "lastModified")) || (key0 === "schemaVersion")) || (key0 === "codebook")) || (key0 === "assetManifest")) || (key0 === "stages"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.name !== undefined){
if(typeof data.name !== "string"){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.description !== undefined){
if(typeof data.description !== "string"){
const err4 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.lastModified !== undefined){
let data2 = data.lastModified;
if(typeof data2 === "string"){
if(!(formats0.test(data2))){
const err5 = {instancePath:instancePath+"/lastModified",schemaPath:"#/properties/lastModified/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/lastModified",schemaPath:"#/properties/lastModified/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.schemaVersion !== undefined){
let data3 = data.schemaVersion;
if(!((typeof data3 == "number") && (isFinite(data3)))){
const err7 = {instancePath:instancePath+"/schemaVersion",schemaPath:"#/properties/schemaVersion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.codebook !== undefined){
if(!(validate179(data.codebook, {instancePath:instancePath+"/codebook",parentData:data,parentDataProperty:"codebook",rootData}))){
vErrors = vErrors === null ? validate179.errors : vErrors.concat(validate179.errors);
errors = vErrors.length;
}
}
if(data.assetManifest !== undefined){
let data5 = data.assetManifest;
if(!(data5 && typeof data5 == "object" && !Array.isArray(data5))){
const err8 = {instancePath:instancePath+"/assetManifest",schemaPath:"#/definitions/AssetManifest/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.stages !== undefined){
let data6 = data.stages;
if(Array.isArray(data6)){
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate201(data6[i0], {instancePath:instancePath+"/stages/" + i0,parentData:data6,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate201.errors : vErrors.concat(validate201.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath:instancePath+"/stages",schemaPath:"#/properties/stages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate178.errors = vErrors;
return errors === 0;
}


function validate177(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(!(validate178(data, {instancePath,parentData,parentDataProperty,rootData}))){
vErrors = vErrors === null ? validate178.errors : vErrors.concat(validate178.errors);
errors = vErrors.length;
}
validate177.errors = vErrors;
return errors === 0;
}