package BinaryStatic;

use Mojo::Base 'Mojolicious';
use Mojo::Util qw/slurp/;
use JSON;
use Template;

sub startup {
    my $self = shift;

    $self->config(decode_json(slurp $self->home->rel_dir('../config.json')));

    $self->plugin(charset => {charset => 'utf-8'});
    $self->plugin('DefaultHelpers');
    $self->plugin('TagHelpers');
    $self->plugin('BinaryStatic::Helpers');

    # fix paths
    $self->renderer->paths([
        $self->home->rel_dir('../src/templates/haml'),
        $self->home->rel_dir('../src/templates/toolkit')
    ]);
    $self->static->paths([
        $self->home->rel_dir('../src')
    ]);

    $self->plugin('haml_renderer', { cache => 0, format => 'html5' });
    $self->plugin('tt_renderer' => {
        template_options => {
            ENCODING     => 'utf8',
            INTERPOLATE  => 1,
            PRE_CHOMP    => $Template::CHOMP_GREEDY,
            POST_CHOMP   => $Template::CHOMP_GREEDY,
            TRIM         => 1,
        }
    });
    $self->renderer->default_handler( 'haml' );
    $self->defaults(layout => 'default');

    # translation
    $self->plugin('I18N', { default => 'en' });
    $self->hook(before_dispatch => sub {
        my $c = shift;

        ## language
        if (my $lang = $c->req->param('l')) {
            $c->languages(lc $lang); # I18N
            $c->session(__lang => lc $lang);
        }
        $c->stash(language => uc($c->session('__lang') || 'en'));

        # other common variables
        $c->stash(website_name => $c->config->{website_name});
    });

    # Router
    my $r = $self->routes;

    $r->get('/')->to('page#haml')->name('home');
    $r->get('/home')->to('page#haml');
    $r->get('/promo/:promo')->to('page#open_account_with_promocode');
    $r->get('/ticker')->to('page#haml');
    $r->get('/timestamp')->to('page#timestamp');
    $r->get('/country')->to('page#country');
    $r->get('/why-us')->to('page#haml')->name('why-us');
    $r->get('/partnerapi')->to('page#haml');
    $r->get('/devguide')->to('page#haml')->name('devguide');

    #CRO - Matjaz
    $r->get('/home5')->to('page#haml')->name('home5');

    # Routing for this rather than adding the file to public/ as everything
    # in public/ will be served by our CDN. We want this served by Mojo.
    $r->get('/robots.txt')->to('page#robots_txt');

    $r->get('/tour')->to('page#haml')->name('tour');
    $r->get('/responsible-trading')->to('page#haml')->name('responsible-trading');
    $r->get('/careers')->to('page#haml')->name('careers');
    $r->get('/group-history')->to('page#haml')->name('group-history');
    $r->get('/smart-indices')->to('page#haml')->name('smart-indices');
    $r->get('/open-source-projects')->to('page#haml')->name('open-source-projects');
    $r->get('/resources')->to('page#haml')->name('resources');
    $r->get('/charting')->to('page#haml')->name('charting');
    $r->get('/about-us')->to('page#haml')->name('about-us');
    $r->get('/contact')->to('page#haml')->name('contact');

    # Display to clients from AppCache when they are offline.
    $r->get('/offline')->to('page#offline')->name('offline');

    $r->get('/styles')->to('page#haml')->name('styles');

    my $get_started = $r->get('/get-started')->name('get-started');
    $get_started->get('/')->to('page#haml');
    $get_started->get('/what-is-binary-trading')->to('page#haml')->name('what-is-binary-trading');
    $get_started->get('/binary-options-basics')->to('page#haml')->name('binary-options-basics');
    $get_started->get('/benefits-of-trading-binaries')->to('page#haml')->name('benefits-of-trading-binaries');
    $get_started->get('/how-to-trade-binaries')->to('page#haml')->name('how-to-trade-binaries');
    $get_started->get('/types-of-trades')->to('page#haml')->name('types-of-trades');
    $get_started->get('/beginners-faq')->to('page#haml')->name('beginners-faq');
    $get_started->get('/glossary')->to('page#haml')->name('glossary');
    $get_started->get('/random-markets')->to('page#haml')->name('random-markets');

    ## login
    $r->get('/login')->to('page#haml')->name('login');
    $r->post('/login')->to('page#login');
    $r->get('/logout')->to('page#logout');

    $r->get('/user/open_account')->to('page#toolkit');
    $r->get('/affiliate/signup')->to('page#toolkit')->name('affiliate-signup');
    $r->get('/resources/pricing_table')->to('page#toolkit');
    $r->get('/charting/application')->to('page#toolkit')->name('charting-application');
    $r->get('/charting/livechart')->to('page#toolkit')->name('charting-livechart');
    $r->get('/resources/rise_fall_table')->to('page#toolkit');
    $r->get('/terms-and-conditions')->to('page#toolkit')->name('terms-and-conditions');

    $r->route('/exception')->to('page#exception');
    $r->route('/*')->to('page#not_found');

}

1;
