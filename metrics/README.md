# metrics plugin
 
## Summary
    The Metrics plugin collects stats of EMG requests and emits key performance indicators. The new implementation offers a metrics plugin similar to the analytics plugin and is turned on by configuration.  Each worker process calculates total target response time, total proxy response time, etc. for each transaction during runtime and sends the data to a new “admin server” for aggregation
 
## When to use this plugin?
    Use this plugin when you wants stats of EMG requests.
 
## Enable the plugin
 
Metrics plugin can be enabled using CLI command edgemicro start. Users have to provide below options.
 
Options: 
-m or --metrics  
 
Cli Command :
 
edgemicro start -o [org] -e [env] -k [key] -s [secret] -m
 
## Plugin configuration properties
 
You can set the following properties in the `oauth` stanza in the Edge Microgateway configuration file.
 
```yaml
metrics: 
    # Admin server provide the http/https server with /stats endpoint to access the EMG stats data.
 
    # Admin server runs on the default Port (EMG PORT + 1) if not explicitly specified.
 
    # We can explicitly mention the Admin Port using in config.yaml file as below
 
    port: 2000
 
    # Rollover all will help to set all proxy numeric values to zero if any one of the numeric values of the proxy # has reached a negative or max numeric value.
 
    rollover_all: true 
 
```
## How to access Admin Server Endpoints?
 
    /stats :
 
        Use /stats endpoint to collect kpi’s for all proxies 
        http://localhost:8001/stats 
 
    /stats/<proxy-name> : 
 
        Use /stats/<proxy-name> to collect  kpi’s of a particular proxy  
        http://localhost:8001/stats/<proxy_name>   