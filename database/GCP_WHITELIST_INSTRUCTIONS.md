# GCP Cloud SQL IP Whitelist Instructions

## 🔍 Current Status
The connection test shows that your IP address is **not whitelisted** in GCP Cloud SQL. You need to add your IP address to the authorized networks.

## 📋 Steps to Whitelist Your IP Address

### Step 1: Get Your Current Public IP Address
Your current public IP address is needed to whitelist it in GCP.

### Step 2: Add IP to GCP Cloud SQL Authorized Networks

1. **Go to GCP Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project: `deft-smile-467218-u8`

2. **Open Cloud SQL**
   - Go to: **SQL** in the left menu
   - Or navigate directly: https://console.cloud.google.com/sql/instances

3. **Select Your Instance**
   - Click on: `free-trial-first-project`
   - Or find it by connection name: `deft-smile-467218-u8:europe-west3:free-trial-first-project`

4. **Go to Connections Tab**
   - Click on the **"Connections"** tab
   - Or go to: **"CONNECTIONS"** section

5. **Add Authorized Network**
   - Click **"Add Network"** or **"Add Authorized Network"**
   - Enter a name (e.g., "My Development Machine" or "Local Development")
   - Enter your IP address in the **Network** field
   - Click **"Save"** or **"Add"**

### Step 3: Alternative - Allow All IPs (NOT RECOMMENDED FOR PRODUCTION)
If you want to allow all IPs temporarily for testing:
- Add network: `0.0.0.0/0`
- ⚠️ **Warning**: This allows connections from anywhere - only use for testing!

### Step 4: Verify Connection
After adding your IP, wait 1-2 minutes for the changes to propagate, then run the test again.

## 🔐 Alternative: Use Cloud SQL Proxy (Recommended for Production)

Instead of whitelisting IPs, you can use Cloud SQL Proxy which is more secure:

### Benefits:
- ✅ No need to whitelist IPs
- ✅ More secure (encrypted tunnel)
- ✅ Works from anywhere
- ✅ Better for production environments

### Setup Cloud SQL Proxy:
1. Download Cloud SQL Proxy:
   ```bash
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
   chmod +x cloud-sql-proxy
   ```

2. Run the proxy:
   ```bash
   ./cloud-sql-proxy deft-smile-467218-u8:europe-west3:free-trial-first-project
   ```

3. Connect to `localhost:5432` instead of the public IP

## 📝 Quick Reference

**Connection Details:**
- Connection Name: `deft-smile-467218-u8:europe-west3:free-trial-first-project`
- IP Address: `34.107.92.139`
- Port: `5432`
- Database: `postgres`
- User: `free-trial-first-project`

**GCP Console Links:**
- SQL Instances: https://console.cloud.google.com/sql/instances
- Your Instance: https://console.cloud.google.com/sql/instances/free-trial-first-project

## ⚠️ Important Notes

1. **IP Changes**: If your IP address changes (e.g., different network), you'll need to update the whitelist
2. **Security**: Only whitelist IPs you trust
3. **Propagation**: Changes may take 1-2 minutes to take effect
4. **SSL**: GCP Cloud SQL requires SSL for public IP connections

## 🧪 After Whitelisting

Once you've added your IP address, run the test again:
```bash
node database/test-gcp-connection.js
```





