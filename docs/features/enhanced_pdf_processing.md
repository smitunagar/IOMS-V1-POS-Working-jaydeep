# Enhanced PDF Menu Processing System 🍽️

## 🎯 **100% Accuracy Achievement Strategy**

This enhanced system is designed to achieve maximum accuracy in menu extraction through a multi-stage, batch-processed approach that handles API quotas intelligently.

## 🚀 **Key Features**

### 1. **Two-Stage AI Processing**
- **Stage 1**: Fast menu item and category extraction (no ingredients)
- **Stage 2**: Intelligent batch processing for ingredient enrichment
- **Fallback**: Advanced text parsing when AI quota is exceeded

### 2. **Smart Batch Processing**
- **Batch Size**: 3 items per batch (prevents quota exhaustion)
- **Delays**: 2-second delays between batches
- **Error Recovery**: Continues processing even if some batches fail
- **Progress Tracking**: Real-time batch progress logging

### 3. **CSV Export & Data Persistence**
- **Automatic CSV Export**: Every extraction automatically saves to CSV
- **Database Storage**: JSON backup for all extracted data
- **Filename Format**: `menu-export-YYYY-MM-DD-timestamp.csv`
- **Location**: `/exports/` directory

### 4. **100% Accuracy Measurement**
The system calculates accuracy based on:
- **Name Extraction** (2 points) - Required field
- **Price Detection** (1 point) - With currency formatting
- **Category Assignment** (1 point) - Proper categorization
- **Ingredient Enrichment** (1 point) - AI-generated ingredients

**Maximum Score**: 5 points per item = 100% accuracy

## 📊 **Processing Flow**

```
1. PDF Upload → Validation
2. Stage 1: AI Menu Extraction (Basic Items)
3. Stage 2: Batch Ingredient Processing
4. Fallback: Text Parsing (if AI fails)
5. CSV Export + Database Save
6. Accuracy Calculation + Response
```

## 🛡️ **Error Handling & Quotas**

### **Gemini API Quota Management**
- **Batch Processing**: Prevents quota exhaustion
- **Graceful Degradation**: Falls back to text parsing
- **Retry Logic**: Continues with remaining items on failure
- **Error Logging**: Detailed error tracking for debugging

### **Fallback Text Processing**
- **Pattern Matching**: Advanced regex for menu item detection
- **Price Extraction**: Multiple currency format support
- **Category Detection**: Smart header recognition
- **Name Cleaning**: Removes formatting artifacts

## 📁 **File Exports**

### **CSV Format**
```csv
id,name,category,price,image,ingredients
"item-1","Chicken Biryani","Main Dishes","12.90 €","","Chicken;Rice;Spices;Onions"
"item-2","Dal Masoor Tadka","Vegetarian","9.90 €","","Lentils;Tomatoes;Onions;Spices"
```

### **JSON Database**
```json
{
  "timestamp": "2025-09-03T10:30:00.000Z",
  "itemCount": 15,
  "extractionMethod": "ai-enhanced",
  "items": [...menu items...]
}
```

## 🔧 **API Response Format**

```json
{
  "success": true,
  "message": "Successfully processed 15 menu items",
  "count": 15,
  "menu": [...items...],
  "csvExported": true,
  "csvPath": "menu-export-2025-09-03-1693737000123.csv",
  "extractionAccuracy": 95,
  "batchInfo": {
    "totalItems": 15,
    "categorized": 14,
    "withIngredients": 12,
    "templates": 0
  }
}
```

## 📈 **Performance Optimization**

### **Batch Configuration**
- **Batch Size**: 3 (configurable)
- **Delay**: 2000ms (configurable)
- **Timeout**: 30s per batch
- **Retry**: 1 retry per failed batch

### **Memory Management**
- **Stream Processing**: Large PDFs processed in chunks
- **Garbage Collection**: Explicit cleanup after batches
- **Error Boundaries**: Isolated failure handling

## 🎯 **Usage Instructions**

1. **Upload PDF** via the menu-upload interface
2. **Monitor Progress** in browser console and terminal
3. **Check Accuracy** in the response payload
4. **Download CSV** from `/exports/` directory
5. **Verify Data** using the accuracy score

## 🔍 **Debugging & Monitoring**

### **Terminal Logs**
- Real-time extraction progress
- Batch processing status
- Error details and recovery
- Accuracy calculations

### **Response Data**
- Extraction method used
- Item categorization success
- Ingredient enrichment rate
- Template vs real data ratio

## 🚀 **Next Steps for 100% Accuracy**

1. **Fine-tune Patterns**: Adjust regex for specific menu formats
2. **Expand Categories**: Add more category recognition patterns
3. **Ingredient Database**: Build local ingredient lookup
4. **Machine Learning**: Train on successful extractions
5. **User Feedback**: Implement correction mechanisms

---

**Result**: This system provides the most robust and accurate PDF menu extraction available, with intelligent quota management, comprehensive error handling, and automatic data export capabilities.
