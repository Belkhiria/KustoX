# 🔧 Cluster Connection Timeout - Troubleshooting

## 🚨 **Current Issue:**
```
Failed to add cluster: Failed to get cloud info for cluster 
https://sqlazureweu2.kustomfa.windows.net - Error: connect ETIMEDOUT 51.138.32.16:443
```

## 📊 **What This Means:**
- ✅ **URL Validation**: Now working (no more "invalid URL" error)
- ❌ **Connection**: Timeout trying to reach the cluster at IP `51.138.32.16:443`
- 🔍 **Root Cause**: Either network issue, wrong URL, or cluster not accessible

## 🧪 **Troubleshooting Steps:**

### Step 1: Verify the Cluster URL
Can you double-check the exact cluster URL from your Azure Data Explorer/Kusto setup?

**Common formats:**
- `https://[cluster-name].kusto.windows.net`
- `https://[cluster-name].kustomfa.windows.net` 
- `https://[cluster-name].[region].kusto.windows.net`

### Step 2: Test Network Connectivity

**Option A: Test in Browser**
1. Open browser
2. Go to: `https://sqlazureweu2.kustomfa.windows.net`
3. Should either:
   - Show Azure login page ✅
   - Show connection error ❌

**Option B: Test with PowerShell**
```powershell
Test-NetConnection -ComputerName sqlazureweu2.kustomfa.windows.net -Port 443
```

### Step 3: Check Your Environment
- Are you behind a **corporate firewall**?
- Do you need to connect via **VPN**?
- Are you using **proxy settings**?

### Step 4: Try Alternative URLs
If you have access to Azure portal:
1. Go to **Azure Data Explorer** service
2. Find your cluster
3. Copy the exact **Query URI** or **Ingestion URI**

## 🔍 **Common Issues:**

### Issue 1: Wrong Region/URL
Maybe try these variations:
- `https://sqlazureweu2.westeurope.kusto.windows.net`
- `https://sqlazureweu2.westeurope.kustomfa.windows.net`

### Issue 2: Corporate Network
If you're on corporate network:
- Try from personal network/mobile hotspot
- Check if VPN connection is required
- Contact IT about firewall rules for `*.kusto.windows.net`

### Issue 3: Cluster Not Running
- Check Azure portal if cluster is running
- Verify cluster name spelling
- Check if cluster exists in correct subscription

## 🧪 **Quick Tests:**

### Test 1: Try Microsoft's Sample Cluster
```
https://help.kusto.windows.net
```
If this works, your network is fine and the issue is with your specific cluster URL.

### Test 2: Check DNS Resolution
```powershell
nslookup sqlazureweu2.kustomfa.windows.net
```

## 🎯 **Next Steps:**

1. **Verify the exact cluster URL** from Azure portal
2. **Test browser access** to the URL
3. **Try the sample cluster** (`https://help.kusto.windows.net`) to isolate the issue
4. **Check network connectivity** with the PowerShell commands above

Can you share:
- The exact cluster URL from your Azure portal?
- Results of testing the URL in a browser?
- Whether `https://help.kusto.windows.net` works in the extension?

This will help pinpoint if it's a URL issue, network issue, or cluster availability issue! 🔍
