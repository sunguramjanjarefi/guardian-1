#!/bin/bash

echo $TEST_NAME
echo $ENVIRONMENT
echo $THREAD
echo $RUMPUP
echo $DURATION

chmod -R a+rwx ${JMETER_HOME}/output
rm -rf ${JMETER_HOME}/output
${JMETER_HOME}/bin/jmeter -n -t ${JMETER_HOME}/test/${TEST_NAME}.jmx -JENVIRONMENT=${ENVIRONMENT} -JTHREAD=${THREAD} -JRUMPUP=${RUMPUP} -JDURATION=${DURATION} -j ${JMETER_HOME}/jmeter.log -l ${JMETER_HOME}/output/jtl/test-Report.jtl -e -o ${JMETER_HOME}/output/html
