#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Additional import path mappings for remaining issues
const additionalMappings = {
  // Hook imports
  "@/hooks/use-toast": "@/shared/hooks/use-toast",
  
  // Library imports
  "@/lib/inventoryService": "@/server/lib/inventoryService",
  "@/lib/menuService": "@/server/lib/menuService",
  "@/lib/orderService": "@/server/lib/orderService",
  "@/lib/utils": "@/server/lib/utils",
  "@/lib/types": "@/server/lib/types",
  
  // Component imports with relative paths
  "../../components/layout/EnterpriseLayout": "@/shared/components/layout/EnterpriseLayout",
  "../../components/layout/AppLayout": "@/shared/components/layout/AppLayout",
  "../../components/ui/": "@/shared/components/ui/",
  
  // Server imports
  "@/server/lib/": "@/server/lib/",
  "@/server/api/": "@/server/api/",
};

// Function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply additional mappings
    for (const [oldPath, newPath] of Object.entries(additionalMappings)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively find and update TypeScript/JavaScript files
function updateImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other directories we don't want to modify
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          updateImportsInDirectory(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        updateImportsInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Main execution
console.log('Fixing remaining import paths...');
updateImportsInDirectory('./src');
console.log('Import path fixes completed!');
