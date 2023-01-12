# JMeter Test Repo

## Advanced performance and api testing set up

### (recommended to make groovy scripts working in JMeter)
- Bearer **accessToken** extracted in the Login test and passed as an Authorization Bearer `${__P(token)}` JMeter property to another Thread Group responsible for the load test.

### Preconditions

- openjdk-11 installed 
``` bash
echo $JAVA_HOME
/Users/<username>/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home
```
### Steps

1. Download lastest JMeter version (e.g. apache-jmeter-5.4.3.tgz) from
https://jmeter.apache.org/download_jmeter.cgi
2. Unpack into `/{username}/Applications` folder
3. Download and set JMeter plugin and Ultimate Thread Group using the following tutorial https://www.perfmatrix.com/jmeter-ultimate-thread-group/  
4. From the `/Users/{username}/Applications/apache-jmeter-5.4.1/bin` start ApacheJMeter.jar
5. Before executing a test, disable all UI elements like any graphs and listeners like View Results Tree
5. Upload file to Blazemeter
6. Execute the test
7. Report performance bugs if any
8. Provide recommendations

### Docker
Run tests
``` bash
docker-compose build && docker-compose run -e THREAD=10 -e RUMPUP=60 -e DURATION=60 -e TEST_NAME=all-order-flows -e ENVIRONMENT=${ENV} load-tests
```
