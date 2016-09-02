var SoundCastBox = React.createClass({
    /* only card clicks go here */
    processCastRequest: function(event){
        /* if on cache page, user is trying to cast a song again */
        if (this.state.drawerPage == 0) {
            //TODO: cast request
        } else {
            // on search page, so user doesn't want state data to change
            // since what if they want to cast more of the artist songs
            console.log(this.state.data);
            console.log(event.target.dataset.pos);
            console.log("done");
            this.updateLocalStorage(this.state.data[event.target.dataset.pos]);
            //TODO: cast request
        }
    },
    updateLocalStorage: function(track) {
        if (localStorage) {
            /* if local exists and user has casted once before */
            if (localStorage['casted_list']) {
                /* check to make sure there is no duplicates */
                var castedList = JSON.parse(localStorage['casted_list']);
                var thereIsADuplicate = false;
                for (var i = 0; i < castedList.length; i++) {
                    if (castedList[i]['id'] === track['id']) {
                        thereIsADuplicate = true;
                        break;
                    }
                }
                if (!thereIsADuplicate) {
                    castedList.unshift(track);
                    localStorage['casted_list'] = JSON.stringify(castedList);
                }
                return;
            }
            /* else, users first time so need to create casted_list */
            localStorage['casted_list'] = JSON.stringify([track]);
        }  
    },
    getInitialState: function() {
        // set up soundcloud object
        SC.initialize({
            client_id: 'ac4e5f2b0425fbbfa63f5626d3c2aaf8'
        });
        // if state is cache and local storage is avail that is initial
        return {data: this.getCastedLocalStorage(), 
                drawerPage: 0, 
                input: ""};
    },
    getCastedLocalStorage: function() {
        return (localStorage && localStorage['casted_list']) ? 
            JSON.parse(localStorage['casted_list']) : []
    },
    getInputText: function() {
        return (this.state.drawerPage == 0) ? "Enter your soundcloud link: " : "Search by Soundcloud Username";
    },
    getIconText: function() {
        return (this.state.drawerPage == 0) ? "cast" : "search";
    },
    getActionText: function() {
        return (this.state.drawerPage == 0) ? "cast again" : "cast";
    },
    onNavClick: function(index) {
        return function(event) {
            event.preventDefault();
            document.getElementById('mdl-layout__drawer').classList.toggle('is-visible');
            /* have to do this for each obfuscator because only on a click from the nav
               then the obfuscator is attainable */
            document.getElementsByClassName('mdl-layout__obfuscator')[0].classList.toggle('is-visible');
            
            // if a state change, reset the data
            if (this.state.drawerPage != index) {
                /* if chance to search page, don't show the local storage */
                if (index == 1) {
                    this.setState({data: [], drawerPage: index});
                } else {
                    this.setState({data: this.getCastedLocalStorage(), drawerPage: index});
                }
            }
        }.bind(this);
    },
    /* is ran from: keyEnterInceptor and on Fab onClick */
    runSoundcloudLogic: function() {
        /* to reuse code */
        var userAndTrack = function(user) {
            return SC.get('users/' + user.id + "/tracks");
        };
        /* fetch by link */
        if (this.state.drawerPage === 0) {
            var urlSplit = this.state.input.split("/");
            /* need onApiError with snackbar */
            if (urlSplit.length > 2) {
                SC.get('users/' + urlSplit[urlSplit.length - 2], {limit: 1})
                .then(userAndTrack)
                .then(function(tracks) {
                    tracks.forEach(function(track) {
                        if (track['permalink'] === urlSplit[urlSplit.length - 1]) {
                            /* update localStorage and state data */
                            this.updateLocalStorage(track);
                            var newCachedArray = this.state.data;
                            newCachedArray.unshift(track);
                            this.setState({data: newCachedArray});
                            /* send request to the chromecast */
                        }
                    }.bind(this))
                }.bind(this))
            }
        } 
        /* fetch by artist */
        else {
            SC.get('users/' + this.state.input, {limit: 1})
            .then(userAndTrack)
            .then(this.updateArtistTracks);
        }
        /* need set on input as well, because setting state won't reset */
        this.setState({input : ""});
        var input = document.getElementById('mdl-input');
        input.value = "";
        input.blur();
        input.parentElement.classList.remove('is-dirty');
    },
    /* updates data using correct 'this' scope in SC object */
    updateArtistTracks: function(tracks) {
        console.log("hmm");
        this.setState({data: tracks});
    },
    /* method useful when user hits enter, instead of FAB button */
    keyEnterInterceptor: function(event) {
        if (event.key === 'Enter') {
            this.runSoundcloudLogic();
            /* prevents on enter to refresh page to ?# */
            event.preventDefault();
        }  
    },
    /* make sure to always maintain state of input field box */
    handleInputChange: function(event) {
        this.setState({input: event.target.value});
    },
    render : function() {
        /* wrapped in a dumby div: https://github.com/facebook/react-devtools/issues/273 */
        return (
            <div>
                <div className="demo-layout-transparent mdl-layout mdl-js-layout">
                    <SoundCastDrawer onNavClick={this.onNavClick}/>

                    <main className="mdl-layout__content">
                        <div id="input-grid" className="mdl-grid">
                            <div style={{width:"100%",position:"relative"}} className="mdl-cell mdl-cell--4-col-phone mdl-cell--10-col mdl-shadow--2dp">
                                <div className="mdl-card__title">
                                    <form action="#">
                                        <div 
                                             style={{width:"100%"}}
                                             className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                                            <input 
                                                onKeyPress={this.keyEnterInterceptor}
                                                onChange={this.handleInputChange}
                                                id="mdl-input" 
                                                className="mdl-textfield__input" type="text" />
                                            <label id="mdl-label" className="mdl-textfield__label center" style={{color:"white"}} htmlFor="mdl-input">
                                                {this.getInputText()}
                                            </label>
                                        </div>
                                    </form>
                                </div>
                                <SoundCastFab 
                                    runFabLogic={this.runSoundcloudLogic}
                                    iconText={this.getIconText()}/>
                            </div>
                        </div>
                         <SoundCastCardList 
                             actionText={this.getActionText()}
                             onCardClick={this.processCastRequest} 
                             data={this.state.data} />
                    </main>

                    <div id="demo-snackbar-example" className="mdl-js-snackbar mdl-snackbar">
                      <div className="mdl-snackbar__text"></div>
                      <button className="mdl-snackbar__action" type="button"></button>
                    </div>
                </div>
           </div>
        )
    }
});

var SoundCastDrawer = React.createClass({
    render: function() {
        return (
            <div id="mdl-layout__drawer" className="mdl-layout__drawer">
                <span className="mdl-layout-title">Soundcloud Caster</span>
                <nav className="mdl-navigation">
                    <a  id="past-casted" 
                        onClick={this.props.onNavClick(0)}
                        className="mdl-navigation__link" href="/">Cache / Cast Soundcloud URL</a>
                    <a id="search-by-user" 
                        onClick={this.props.onNavClick(1)} 
                        className="mdl-navigation__link" href="/">Search By User</a>
                </nav>
            </div>
        )
    }
});

var SoundCastFab = React.createClass({
    render: function() {
        return (
            <button 
                onClick={this.props.runFabLogic}
                id="cast-button" 
                className="mdl-button mdl-js-button mdl-button--fab mdl-button--colored">
                <i id="mdl-icon" className="material-icons">{this.props.iconText}</i>
            </button>
        )
    }
});

var SoundCastCardList = React.createClass({
    render: function() {
        var soundCastCards = this.props.data.map(function(track, index) {
            return (
                <SoundCastCard 
                    actionText={this.props.actionText}
                    index={index}
                    castRequest={this.props.onCardClick}
                    track={track} />
            );                                        
        }.bind(this));
        return (
            <div id="sound-grid" className="mdl-grid">
                {soundCastCards}
            </div>
        )
    }
});

var SoundCastCard = React.createClass({
    render: function() {
        return (
            <div className="mdl-cell mdl-cell--3-col demo-card-square mdl-card mdl-shadow--2dp">
                <div 
                    style={{backgroundImage: this.setUpCardBackgroundImage()}}
                    className="mdl-card__title mdl-card--expand">
                    <h2 className="mdl-card__title-text">
                        {this.props.track.user.username}
                    </h2>
                </div>
            
                <div className="mdl-card__supporting-text">
                        {this.props.track.title}
                </div>
            
                <div className="mdl-card__actions mdl-card--border">
                    <div 
                        data-pos={this.props.index}
                        onClick={this.props.castRequest}
                        className="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">
                        {this.props.actionText}
                    </div>
                </div>
            </div>
        )
    },
    setUpCardBackgroundImage: function() {
        return (this.props.track.artwork_url) ? "url(" + this.props.track.artwork_url.replace('large.jpg', 't500x500.jpg') + ")" : "";  
    }
});

ReactDOM.render(<SoundCastBox />, document.getElementById('content'));