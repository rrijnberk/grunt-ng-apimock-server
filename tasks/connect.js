(function () {
    var responseRequestRegex = /^\/mocks\/([a-zA-Z_]*)\/([a-zA-Z_]*)\/([a-zA-Z_]*)/,
        responsesRequestRegex = /^\/mocks\/([a-zA-Z_]*)\/([a-zA-Z_]*)/,
        capabilitiesRequestRegex = /^\/mocks\/([a-zA-Z_]*)/,
        servicesRequestRegex = /^\/mocks/,
        fileNameRegex = /^.*\/([a-zA-Z_]*).mock.json$/,
        directoryNameRegex = /^.*\/([a-zA-Z_]*)$/;

    var path = require('path'),
        root = path.resolve('./');

    function toNameCase(lowerCase){
        return lowerCase.substring(0,1).toUpperCase().concat(lowerCase.substring(1));
    }

    function generateResponseName(fileName) {
        return fileName.split('_').map(toNameCase).join(' ');
    }
    
    function generateResponseOption(fileName){
        return {
            name: generateResponseName(fileNameRegex.exec(fileName)[1]),
            value: fileNameRegex.exec(fileName)[1]
        }
    }

    function generateDirectoryName(directoryPath){
        return directoryNameRegex.exec(directoryPath)[1];
    }

    module.exports = function (grunt) {

        /**
         * Retrieve the required response for the service and capability.
         * @param req The request made.
         * @param res The response given.
         */
        function handleResponseRequest(req, res){
            var params = responseRequestRegex.exec(req.url),
                service = params[1],
                capability = params[2],
                response = params[3];

            grunt.log.writeln(
                'Serving response \'' + response +
                '\' for service \'' + service +
                '\' and capability \'' + capability +
                '\'.');

            var content = grunt.file.readJSON(
                path.resolve(
                    root, 'mocks', service, capability, response.concat('.mock.json')
                ));

            res.end(JSON.stringify(content));
        }

        /**
         * Retrieve the available responses for the service capability.
         * @param req The request made.
         * @param res The response given.
         */
        function handleResponsesRequest(req, res){
            var params = responsesRequestRegex.exec(req.url),
                service = params[1],
                capability = params[2];

            grunt.log.writeln(
                'Serving responses for capability \'' + capability +
                '\' of service \'' + service +
                '\'.');

            var content = grunt.file.expand(
                path.resolve(
                    root, 'mocks', service, capability, '*.json'
                )).map(generateResponseOption);

            res.end(JSON.stringify(content));
        }

        /**
         * Retrieve the available capabilities for the service.
         * @param req The request made.
         * @param res The response given.
         */
        function handleCapabilitiesRequest(req, res){
            var params = capabilitiesRequestRegex.exec(req.url),
                service = params[1];

            grunt.log.writeln('Serving capbilities for service \'' + service + '\'.');

            var content = grunt.file.expand(
                path.resolve(
                    root, 'mocks', service, '*'
                )).map(generateDirectoryName);

            res.end(JSON.stringify(content));
        }

        /**
         * Retrieve the available services.
         * @param res The response given.
         */
        function handleServicesRequest(res){
            grunt.log.writeln('Serving services.');

            var content = grunt.file.expand(
                path.resolve(
                    root, 'mocks', '*'
                )).map(generateDirectoryName);

            res.end(JSON.stringify(content));
        }

        grunt.config.merge({
            connect: {
                mocks: {
                    options: {
                        port: 8282,
                        hostname: '*',
                        middleware: [
                            function myMiddleware(req, res, next) {
                                if(responseRequestRegex.test(req.url)) {
                                    handleResponseRequest(req, res);
                                } else if (responsesRequestRegex.test(req.url)) {
                                    handleResponsesRequest(req, res);
                                } else if (capabilitiesRequestRegex.test(req.url)) {
                                    handleCapabilitiesRequest(req, res);
                                } else if (servicesRequestRegex.test(req.url)) {
                                    handleServicesRequest(res);
                                } else {
                                    res.end("{}");
                                }
                                next();

                            }
                        ],
                        keepalive: true
                    }
                }
            }
        });
    }
}());