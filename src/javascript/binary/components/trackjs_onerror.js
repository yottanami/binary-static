window._trackJs = {
    onError: function(payload, error) {

        // ignore an error caused by DealPly (http://www.dealply.com/) chrome extension
        if (payload.message.indexOf("DealPly") > 0) {
            return false;
        }

        // this error is reported when a post request returns error, i.e. html body
        // the details provided in this case are completely useless, thus discarded
        if (payload.message.indexOf("Unexpected token <") > 0) {
            return false;
        }

        payload.network = payload.network.filter(function(item) {

            // ignore random errors from Intercom
            if (item.statusCode === 403 && payload.message.indexOf("intercom") > 0) {
                return false;
            }

            return true;
        });

        return true;
    }
};
