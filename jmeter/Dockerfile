FROM adoptopenjdk/openjdk11:latest
ENV JMETER_VERSION "5.4.3"
ENV JMETER_PLUGIN_VERSION "1.7"
ENV JMETER_HOME /opt/apache-jmeter-${JMETER_VERSION}
ENV JMETER_BIN ${JMETER_HOME}/bin
ENV PATH $PATH:$JMETER_BIN
ENV JMETER_DOWNLOAD_URL https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz
ENV JMETER_PLUGIN_URL http://search.maven.org/remotecontent?filepath=kg/apc/jmeter-plugins-manager/${JMETER_PLUGIN_VERSION}/jmeter-plugins-manager-${JMETER_PLUGIN_VERSION}.jar
ENV JMETER_CONCURRENCY_PLUGIN https://jmeter-plugins.org/files/packages/jpgc-casutg-2.10.zip
ENV THROUGHPUT_SHAPING_TIMER https://jmeter-plugins.org/files/packages/jpgc-tst-2.5.zip

WORKDIR	${JMETER_HOME}

RUN apt-get -y update && \
    apt-get -y install \
    wget \
    tar \
    unzip

RUN wget ${JMETER_DOWNLOAD_URL} \	
    && tar -xzf ${JMETER_HOME}/apache-jmeter-${JMETER_VERSION}.tgz -C /opt  \
    && rm -rf ${JMETER_HOME}/apache-jmeter-${JMETER_VERSION}.tgz

RUN rm /opt/apache-jmeter-${JMETER_VERSION}/bin/user.properties
COPY ./user.properties /opt/apache-jmeter-${JMETER_VERSION}/bin/user.properties 

RUN wget ${JMETER_PLUGIN_URL} -O ./lib/ext/jmeter-plugins-manager-${JMETER_PLUGIN_VERSION}.jar

RUN wget ${JMETER_CONCURRENCY_PLUGIN} \
    && unzip ${JMETER_HOME}/jpgc-casutg-2.10.zip -d /opt \
    && rm -rf ${JMETER_HOME}/jpgc-casutg-2.10.zip \
    && mv /opt/lib/jmeter-plugins-cmn-jmeter-0.6.jar /opt/apache-jmeter-${JMETER_VERSION}/lib \
    && mv /opt/lib/ext/* /opt/apache-jmeter-${JMETER_VERSION}/lib/ext

RUN wget ${THROUGHPUT_SHAPING_TIMER} \
    && unzip ${JMETER_HOME}/jpgc-tst-2.5.zip -d /opt \
    && rm -rf ${JMETER_HOME}/jpgc-tst-2.5.zip \
    && mv /opt/lib/ext/jmeter-plugins-tst-2.5.jar /opt/apache-jmeter-${JMETER_VERSION}/lib/ext

COPY ./run.sh ./run.sh
RUN chmod +x ./run.sh
