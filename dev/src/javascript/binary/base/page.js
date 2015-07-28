var text;

var gtm_data_layer_info = function() {
    var gtm_data_layer_info = [];
    $('.gtm_data_layer').each(function() {
        var gtm_params = {};
        var event_name = '';
        $(this).children().each(function() {
            var tag = $(this).attr("id");
            var value = $(this).html();

            if ($(this).attr("data-type") == "json") {
                value = JSON.parse($(this).html());
            }

            if (tag == "event") {
                event_name = value;
            } else {
                gtm_params[tag] = value;
            }
        });
        gtm_params['url'] = document.URL;

        var entry = {};
        entry['params'] = gtm_params;
        entry['event'] = event_name;
        gtm_data_layer_info.push(entry);
    });

    return gtm_data_layer_info;
};

var User = function() {
    this.email =  $.cookie('email');
    var loginid_list = $.cookie('loginid_list');

    if(this.email === null || typeof this.email === "undefined") {
        this.is_logged_in = false;
    } else {
        this.is_logged_in = true;

        if(loginid_list !== null && typeof loginid_list !== "undefined") {
            var loginid_array = [];
            var loginids = loginid_list.split('+').sort();

            for (var i = 0; i < loginids.length; i++) {
                var real = false;
                var disabled = false;
                var items = loginids[i].split(':');
                if (items[1] == 'R') {
                    real = true;
                }
                if (items[2] == 'D') {
                    disabled = true;
                }

                var id_obj = { 'id':items[0], 'real':real, 'disabled':disabled };
                if (/MLT/.test(items[0])) {
                    id_obj['non_financial']= true;
                }
                if (/MF/.test(items[0])) {
                    id_obj['financial']= true;
                }
                loginid_array.push(id_obj);
            }

            this.loginid_array = loginid_array;
        }
    }
};

var Client = function() {
    this.loginid =  $.cookie('loginid');
    this.is_logged_in = false;
    this.is_real = false;
    if(this.loginid === null || typeof this.loginid === "undefined") {
        this.type = 'logged_out';
    } else if(/VRT/.test(this.loginid)) {
        this.type = 'virtual';
        this.is_logged_in = true;
    } else {
        this.type = 'real';
        this.is_logged_in = true;
        this.is_real = true;
    }

    var dl_info = gtm_data_layer_info();
    if(dl_info.length > 0) {
        for (var i=0;i<dl_info.length;i++) {
            if(dl_info[i].event == 'log_in') {
                SessionStore.set('client_info', this.loginid + ':' + dl_info[i].params.bom_firstname + ':'  + dl_info[i].params.bom_lastname + ':' + dl_info[i].params.bom_email + ':' + dl_info[i].params.bom_phone);
            }
        }
    }

    var client_info = SessionStore.get('client_info');
    if(client_info) {
        var parsed = client_info.split(':');
        if(this.is_logged_in && parsed[0] == this.loginid) {
            this.first_name = parsed[1];
            this.last_name = parsed[2];
            this.name = this.first_name +  ' ' + this.last_name;
            this.email = parsed[3];
            this.phone = parsed[4];
        } else {
            SessionStore.remove('client_info');
        }
    }
};

var URL = function (url) { // jshint ignore:line
    this.is_valid = true;
    this.history_supported = window.history && window.history.pushState;
    if(typeof url !== 'undefined') {
        this.location = $('<a>', { href: decodeURIComponent(url) } )[0];
    } else {
        this.location = window.location;
    }
};

URL.prototype = {
    url_for: function(path, params, type) {
        var mid_path = '/';
        if(/.cgi/.test(path)) {
            if(type == 'cached') {
                mid_path = '/c/';
            } else {
                mid_path = '/d/';
            }
        }

        var url = "https://" + this.location.host + mid_path + path;
        if(params) {
            url += '?' + params;
            url += '&l=' + page.language();
        } else {
            url += '?l=' + page.language();
        }

        return url;
    },
    reset: function() {
        this.location = window.location;
        this._param_hash = undefined;
        this.is_valid = true;
        $(this).trigger("change", [ this ]);
    },
    invalidate: function() {
        this.is_valid = false;
    },
    update: function(url) {
        var state_info = { container: 'content', url: url, useClass: 'pjaxload' };
        if(this.history_supported) {
            history.pushState(state_info, '', url);
            this.reset();
        }
        this.is_valid = true;
    },
    param: function(name) {
        var param_hash= this.params_hash();
        return param_hash[name];
    },
    param_if_valid: function(name) {
        if(this.is_valid) {
           return this.param(name);
        }
        return;
    },
    path_matches: function(url) {
        //pathname is /d/page.cgi. Eliminate /d/ and /c/ from both urls.
        var this_pathname = this.location.pathname.replace(/\/[d|c]\//g, '');
        var url_pathname = url.location.pathname.replace(/\/[d|c]\//g, '');
        return (this_pathname == url_pathname || '/' + this_pathname == url_pathname);
    },
    params_hash_to_string: function(params) {
        var as_array = [];
        for(var p_key in params) if (params.hasOwnProperty(p_key)) {
            as_array.push(p_key + '=' + params[p_key]);
        }

        return as_array.join('&');
    },
    is_in: function(url) {
        if(this.path_matches(url)) {
            var this_params = this.params();
            var param_count = this_params.length;
            var match_count = 0;
            while(param_count--) {
                if(url.param(this_params[param_count][0]) == this_params[param_count][1]) {
                    match_count++;
                }
            }
            if(match_count == this_params.length) {
                return true;
            }
        }

        return false;
    },
    params_hash: function() {
        if(!this._param_hash) {
            this._param_hash = {};
            var params = this.params();
            var param = params.length;
            while(param--) {
                this._param_hash[params[param][0]] = params[param][1];
            }
        }
        return this._param_hash;
    },
    params: function() {
        var params = [];
        var parsed = this.location.search.substr(1).split('&');
        var p_l = parsed.length;
        while(p_l--) {
            var param = parsed[p_l].split('=');
            params.push(param);
        }
        return params;
    },
};

var Header = function(params) {
    this.user = params['user'];
    this.client = params['client'];
    this.settings = params['settings'];
    this.clock_started = false;
};

Header.prototype = {
    on_load: function() {
        this.show_or_hide_login_form();
        if (!this.clock_started) this.start_clock();
    },
    show_or_hide_login_form: function() {
        if (this.user.is_logged_in && this.client.is_logged_in) {
            var loginid_select = '';
            var loginid_array = this.user.loginid_array;
            for (var i=0;i<loginid_array.length;i++) {
                if (loginid_array[i].disabled) continue;

                var curr_loginid = loginid_array[i].id;
                var real = loginid_array[i].real;
                var selected = '';
                if (curr_loginid == this.client.loginid) {
                    selected = ' selected="selected" ';
                }

                var loginid_text;
                if (real) {
                    if(loginid_array[i].financial){
                        loginid_text = text.localize('Investment Account') + ' (' + curr_loginid + ')';
                    } else if(loginid_array[i].non_financial) {
                        loginid_text = text.localize('Gaming Account') + ' (' + curr_loginid + ')';
                    } else {
                        loginid_text = text.localize('Real Account') + ' (' + curr_loginid + ')';
                    }
                } else {
                    loginid_text = text.localize('Virtual Account') + ' (' + curr_loginid + ')';
                }

                loginid_select += '<option value="' + curr_loginid + '" ' + selected + '>' + loginid_text +  '</option>';
            }
            $("#client_loginid").html(loginid_select);
        }
    },
    register_dynamic_links: function() {
        var logged_in_url = page.url.url_for('');
        if(this.client.is_logged_in) {
            logged_in_url = page.url.url_for('user/my_account');
        }
    },
    start_clock: function() {
        var clock = $('#gmt-clock');
        if (clock.length === 0) {
            return;
        }

        var that = this;
        var clock_handle;
        var sync = function() {
            var query_start_time = (new Date().getTime());
            $.ajax({crossDomain: true, url: page.url.url_for('timestamp'), async: true, dataType: "json"}).done(function(response) {
                var start_timestamp = response.timestamp;

                //time now is timestamp from server + ping time.
                //ping time = roundtrip time / 2
                //roundtrip time = time at start of request - time after response.
                that.time_now = (start_timestamp * 1000) + (((new Date().getTime()) - query_start_time)/2);
                var increase_time_by = function(interval) {
                    that.time_now += interval;
                };

                var update_time = function() {
                    clock.html(moment(that.time_now).utc().format("YYYY-MM-DD HH:mm") + " GMT");
                };

                update_time();

                clearInterval(clock_handle);

                clock_handle = setInterval(function() {
                    increase_time_by(1000);
                    update_time();
                }, 1000);
            });
        };

        sync();
        setInterval(function() {
            sync();
        }, 900000);

        this.clock_started = true;
        return;
    },
};

var ToolTip = function() {
    this.tooltip = $('#tooltip');

    if (this.tooltip.length === 0) {
        this.tooltip = $('<div id="tooltip"></div>');
        this.tooltip.css('display', 'none')
            .appendTo('body');
    }

    this.showing = {};
    var that = this;
    $(window).resize(function() { that.resize_tooltip(); });
};

ToolTip.prototype = {
    attach: function() {
        var that = this;
        this.detach();

        var targets = $( '[rel~=tooltip]' ),
            target  = false,
            tip     = false,
            title   = false;

        targets.on('mouseenter', function(e) {
            tip = $(this).attr( 'title' );

            if( !tip || tip === '' )
                return false;

            that.showing.target = $(this);
            that.showing.tip = tip;

            that.showing.target.removeAttr( 'title' );

            that.tooltip.html(tip);
            that.resize_tooltip();
            that.reposition_tooltip_for(that.showing.target);
            that.show_tooltip($(this));
        });

        targets.on('mouseleave', function() {
            if(that.showing.target) {
                that.showing.target.attr( 'title', that.showing.tip );
            }
            that.hide_tooltip();
        });

        targets.on('click', function() {
            if(that.showing.target) {
                that.showing.target.attr( 'title', that.showing.tip );
            }
            that.hide_tooltip();
        });
    },
    detach: function() {
        $( '[rel~=tooltip]' ).off('mouseenter');
        $( '[rel~=tooltip]' ).off('mouseleave');
        this.tooltip.off('click');
    },
    show_tooltip: function(target) {
        this.tooltip.css({ display: ''});
        this.tooltip.zIndex(target.zIndex() + 100);
    },
    hide_tooltip: function(tooltip) {
        this.tooltip.html("");
        this.tooltip.css({ top: 0, left: 0, display: 'none'});
        this.tooltip.addClass('invisible');
    },
    resize_tooltip: function() {
        if( $( window ).width() < this.tooltip.outerWidth() * 1.5 )
            this.tooltip.css( 'max-width', $( window ).width() / 2 );
        else
            this.tooltip.css( 'max-width', 340 );
    },
    reposition_tooltip_for: function(target) {
        this.tooltip.removeClass('invisible');

        var pos_left = target.offset().left + ( target.outerWidth() / 2 ) - ( this.tooltip.outerWidth() / 2 ),
            pos_top = target.offset().top - (this.tooltip.outerHeight() + 10);

        this.tooltip.removeClass( 'left' );
        this.tooltip.removeClass( 'right' );
        this.tooltip.removeClass( 'top' );

        if( pos_left < 0 ) {
            pos_left = target.offset().left + target.outerWidth() / 2 - 20;
            this.tooltip.addClass( 'left' );
        }

        if( pos_left + this.tooltip.outerWidth() > $( window ).width() ) {
            pos_left = target.offset().left - this.tooltip.outerWidth() + target.outerWidth() / 2 + 20;
            this.tooltip.addClass( 'right' );
        }

        if( pos_top < 0 ) {
            pos_top  = target.offset().top + target.outerHeight() + 20;
            this.tooltip.addClass( 'top' );
        }

        this.tooltip.css( { left: pos_left, top: pos_top} );
    },
};

var Contents = function(client, user) {
    this.client = client;
    this.user = user;
    this.tooltip = new ToolTip();
};

Contents.prototype = {
    on_load: function() {
        this.activate_by_client_type();
        this.update_body_id();
        this.update_content_class();
        this.tooltip.attach();
    },
    on_unload: function() {
        this.tooltip.detach();
        if ($('.unbind_later').length > 0) {
            $('.unbind_later').off();
        }
    },
    has_real_account: function() {

        if (!this.user.is_logged_in) return false;

        for (var i = 0; i < this.user.loginid_array.length; i++) {
            if (this.user.loginid_array[i].real == 1) return true;
        }
        return false;
    },
    init_access_classes: function() {
        $('body')
            .removeClass()
            .toggleClass('client-logged-in', this.client.is_logged_in)
            .toggleClass('client-not-logged-in', !this.client.is_logged_in)
            .toggleClass('client-is-real', this.client.is_real)
            .toggleClass('client-is-virtual', this.client.is_virtual)
            .toggleClass('client-has-real', this.has_real_account())
            .toggleClass('client-1', !$.cookie('staff') || !/^Q?MF|MLT/.test(this.client.loginid))
            .toggleClass('client-2', !/^Q?CR/.test(this.client.loginid));
    },
    activate_by_client_type: function() {

        this.init_access_classes();

        $('.by_client_type').addClass('invisible');

        if (this.client.is_logged_in) {

            if(this.client.is_real) {
                $('.by_client_type.client_real').removeClass('invisible');
                $('.by_client_type.client_real').show();

                if (!/^Q?CR/.test(this.client.loginid)) {
                    $('#payment-agent-section').addClass('invisible');
                    $('#payment-agent-section').hide();
                }

                // temporary only show for internal staff
                if (!$.cookie('staff') || !/^Q?MF|MLT/.test(this.client.loginid)) {
                    $('#account-transfer-section').addClass('invisible');
                    $('#account-transfer-section').hide();
                }
            } else {
                $('.by_client_type.client_virtual').removeClass('invisible');
                $('.by_client_type.client_virtual').show();
            }
        } else {
            $('.by_client_type.client_logged_out').removeClass('invisible');
            $('.by_client_type.client_logged_out').show();
        }
    },
    update_body_id: function() {
        //This is required for our css to work.
        $('body').attr('id', '');
        $('body').attr('id', $('#body_id').html());
    },
    update_content_class: function() {
        var contentClass = $('#content_class').html();

        $('#content').parent()
            .removeClass()
            .addClass(contentClass);
    }
};

var Page = function(config) {
    config = typeof config !== 'undefined' ? config : {};
    this.user = new User();
    this.client = new Client();
    this.url = new URL();
    this.settings = new InScriptStore(config['settings']);
    this.header = new Header({ user: this.user, client: this.client, settings: this.settings, url: this.url});
    this.contents = new Contents(this.client, this.user);
};

Page.prototype = {
    language: function() {
        if(page.url.param('l')) {
            return page.url.param('l');
        } else {
            return 'EN';
        }
    },
    flag: function() {
        var idx = $('.language-options li a.selected').parent().index(),
            offset = - (idx + 1) * 15,
            cssStyle = '0 ' + offset + 'px';
        $('.nav-languages a').css('background-position', cssStyle);
    },
    on_load: function() {
        this.apply_pjax_class();
        this.url.reset();
        this.localize_for(this.language());
        this.header.on_load();
        this.flag();
        this.on_change_language();
        this.on_change_loginid();
        this.record_affiliate_exposure();
        this.contents.on_load();
        this.on_click_signup();
        this.on_input_password();
        this.on_click_acc_transfer();
        this.on_click_view_balances();
    },
    on_unload: function() {
        this.contents.on_unload();
    },
    apply_pjax_class: function() {
        var pjaxableLinks = $('a').filter(function() {
            return this.hostname == location.hostname;
        });
        pjaxableLinks.addClass('pjaxload');
    },
    on_change_language: function() {
        var that = this;
        $('.language-options').on('click', 'li', function(e) {
            var language = $(this).find('a').attr('data-langcode');
            document.location = that.url_for_language(language);
            e.preventDefault();
        });
    },
    on_change_loginid: function() {
        var that = this;
        $('#client_loginid').on('change', function() {
            $('#loginid-switch-form').submit();
        });
    },
    on_input_password: function() {
        $('#chooseapassword').on('input', function() {
            $('#reenter-password').removeClass('invisible');
            $('#reenter-password').show();
        });
    },
    on_click_signup: function() {
        $('#btn_registration').on('click', function() {
            var pwd = $('#chooseapassword').val();
            var pwd_2 = $('#chooseapassword_2').val();
            var email = $('#Email').val();

            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
                $('#signup_error').text(text.localize('Invalid email address'));
                $('#signup_error').removeClass('invisible');
                $('#signup_error').show();
                return false;
            }
            if (pwd.length === 0 || pwd_2.length === 0 || !client_form.compare_new_password(pwd, pwd_2)) {
                $('#signup_error').text(text.localize('The two passwords that you entered do not match.'));
                $('#signup_error').removeClass('invisible');
                $('#signup_error').show();
                return false;
            }
            // email != password
            if (email == pwd) {
                $('#signup_error').text(text.localize('Your password cannot be the same as your email'));
                $('#signup_error').removeClass('invisible');
                $('#signup_error').show();
                return false;
            }

            $('#virtual-acc-form').submit();
        });
    },
    on_click_acc_transfer: function() {
        $('#acc_transfer_submit').on('click', function() {
            var amount = $('#acc_transfer_amount').val();
            if (!/^[0-9]+\.?[0-9]{0,2}$/.test(amount) || amount < 0.1) {
                $('#invalid_amount').removeClass('invisible');
                $('#invalid_amount').show();
                return false;
            }
            $('#acc_transfer_submit').submit();
        });
    },
    on_click_view_balances: function() {
        $('#view-balances').on('click', function(event) {
            event.preventDefault();
            if ($(this).hasClass("disabled")) {
                return false;
            }
            $(this).addClass("disabled");

            $.ajax({
                url: page.url.url_for('user/balance'),
                dataType: 'text',
                success: function (data) {
                    var outer = $('#client-balances');
                    if (outer) outer.remove();

                    outer = $("<div id='client-balances' class='lightbox'></div>").appendTo('body');
                    middle = $('<div />').appendTo(outer);
                    $('<div>' + data + '</div>').appendTo(middle);

                    $('#client-balances [bcont=1]').on('click', function () {
                        $('#client-balances').remove();
                    });
                },
            }).always(function() {
                $('#view-balances').removeClass("disabled");
            });
        });
    },
    localize_for: function(language) {
        text = texts[language];
        moment.locale(language.toLowerCase());
    },
    url_for_language: function(lang) {
        lang = lang.trim().toUpperCase();
        SessionStore.set('selected.language', lang);
        var loc = document.location; // quick access
        var qs = loc.search || '?';
        var url = loc.protocol + '//' + loc.host + loc.pathname;
        if (qs.indexOf('l=') >= 0) {
            url += qs.replace(/(\?|&)l=[A-Z_]{2,5}/, "$1l=" + lang);
        } else {
            if (qs.length > 1) {
                lang = '&l=' + lang;
            } else {
                lang = 'l=' + lang;
            }
            url += qs + lang;
        }
        return url;
    },
    record_affiliate_exposure: function() {
        var token = this.url.param('t');
        var token_valid = /\w{32}/.test(token);
        var is_subsidiary = /\w{1}/.test(this.url.param('s'));

        if (!token_valid) {
            return false;
        }

        var cookie_value = $.cookie('affiliate_tracking');
        if(cookie_value) {
            var cookie_token = JSON.parse(cookie_value);

            //Already exposed to some other affiliate.
            if (is_subsidiary && cookie_token && cookie_token["t"]) {
                return false;
            }
        }

        //Record the affiliate exposure. Overwrite existing cookie, if any.
        var cookie_hash = {};
        if (token_valid) {
            cookie_hash["t"] = token.toString();
        }
        if (is_subsidiary) {
            cookie_hash["s"] = "1";
        }

        $.cookie("affiliate_tracking", JSON.stringify(cookie_hash), {
            expires: 365, //expires in 365 days
            path: '/',
            domain: '.' + location.hostname.split('.').slice(-2).join('.')
        });
    }
};
