var PricingDetails = function() {
    return {
        register: function() {
            if(this.popup().length > 0) {
                this.on_open_debug_link();
                this.on_close();
            }
        },
        on_open_debug_link: function() {
            var that = this;
            $('a.pricing-details').on('click', function (event) {
                var popup = that.popup();
                popup.toggleClass('invisible');
                event.preventDefault();
            }).addClass('unbind_later');
        },
        on_close: function() {
            var that = this;
            $('a.pricing-details-close').on('click', function (event) {
                that.popup().addClass('invisible');
                event.preventDefault();
            }).addClass('unbind_later');
        },
        popup: function() {
            return $('#pricing_details_popup');
        }
    };
}();
