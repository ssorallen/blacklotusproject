/**
 * @fileOverview Black Lotus Project JavaScript API
 * Uses data from http://blacklotusproject.com/json
 *
 * @author: <a href="http://github.com/ssorallen/">Ross Allen</a>
 * @version: 1.0.0
 */
(function() {

    if(!window.blproject) {
        var blp = window.blproject = {};

        /* Timestamp for JSON function so multiple JSONP responses
           can live on a single page */
        blp.jsc = new Date();

        blp.PriceTable = function(){};
        blp.PriceTable.prototype = {
            draw: function(elementId) {
                if(elementId) {
                    this.element = document.getElementById(elementId);
                    if(this.element) {
                        var that = this;
                        this.jsonp = "blproject_jsonp" + blp.jsc++;
                        window[this.jsonp] = function(jsonData) { that.generate(jsonData); };

                        var head = document.getElementsByTagName("head")[0];
                        this.script = document.createElement("script");
                        this.script.src = "http://blacklotusproject.com/json?jsonp=" + this.jsonp;
                        if(this.currency) this.script.src += "&currency=" + this.currency;

                        head.appendChild(this.script);
                        return undefined;
                    }
                }
            },
            generate: function(data) {
                var prices = eval(data)["cards"],
                    h3 = document.createElement("h3");
                h3.innerHTML = "Today's Most Popular Cards";

                var ol = document.createElement("ol");
                for(var i = 0; i < prices.length; i++) {
                    var li = document.createElement("li"),

                        p = prices[i],
                        change = p["change"],
                        color = (change * 1) >= 0 ? "green" : "#A03",
                        str = "<a href=\"" + p["url"] + "\">" + p["name"];

                    if(!this.hideset) str += " (" + p["set_code"] + ")";
                    str += "</a> <span style=\"display: block;\">$" + p["price"]
                        + " <span style=\"color: " + color + ";\">" + change
                        + "  (" + p["percent_change"] + "%)</span></span>";

                    if(i % 2) li.className = "even";
                    li.innerHTML = str;
                    ol.appendChild(li);
                }

                this.element.innerHTML = "";
                this.element.appendChild(h3);
                this.element.appendChild(ol);

                /* Clean up the JSONP script */
                window[this.jsonp] = undefined;
                var head = document.getElementsByTagName("head")[0];
                if(head) {
                    head.removeChild(this.script);
                }
                try {
                    delete window[this.jsonp];
                    delete this.jsonp;
                    delete this.script;
                } catch(e){}
            }
        };

        blp.PriceTicker = function(){};
        blp.PriceTicker.prototype = {
            draw: function(elementId) {
                if(elementId) {
                    this.e = document.getElementById(elementId);
                    if(this.e) {
                        var that = this;
                        this.jsonp = "blproject_jsonp" + blp.jsc++;
                        window[this.jsonp] = function(jsonData) { that.generate(jsonData); };

                        this.e.style.overflowX = "hidden";
                        var head = document.getElementsByTagName("head")[0];
                        this.script = document.createElement("script");
                        this.script.src = "http://blacklotusproject.com/json?jsonp=" + this.jsonp;
                        if(this.currency) this.script.src += "&currency=" + this.currency;

                        if(this.cards) {
                            for(var i = 0; i < this.cards.length; i++) {
                                var card_name = this.cards[i];
                                if(i === 0) card_name = "&cards=" + card_name;
                                else card_name = "|" + card_name;
                                this.script.src += card_name;
                            }
                        }

                        head.appendChild(this.script);
                        return undefined;
                    }
                }
            },
            generate: function(data) {
                this.e.innerHTML = "<table><tr><td nowrap=\"nowrap\"></td></tr></table>";

                var symbols = { "USD": "$", "GBP": "£", "EUR": "€", "CNY": "¥", "ANG": "ƒ" },
                    evaled = eval(data),
                    prices = evaled["cards"],
                    currency = evaled["currency"],
                    td = this.e.getElementsByTagName("td")[0];

                currency = symbols[currency] ? symbols[currency] : currency;

                if(!this.continuous) {
                    var spacer = document.createElement("b");

                    /* Fix for Firefox 2, which doesn't support "inline-block" */
                    spacer.style.cssText = "display:-moz-inline-stack;"

                    spacer.style.display = "inline-block";
                    spacer.style.width = this.e.offsetWidth + "px";
                    td.appendChild(spacer);
                }

                for(var i = 0; i < prices.length; i++) {

                    var p = prices[i],
                        change = p["change"],
                        up = (change * 1) >= 0,
                        color = up ? this.up_color || "green" : this.down_color || "#A03",
                        inlineColor = this.up_color !== "none" && this.down_color !== "none",
                        upClass = up ? "blproject_price_up" : "blproject_price_down",
                        str = "<a href=\"" + p["url"] + "\">" + p["name"],
                        span = document.createElement("span");

                    span.style.paddingLeft = "15px";

                    if(!this.hideset) str += " (" + p["set_code"] + ")";
                    str += "</a> <span class=\"blproject_price\">" + currency + p["price"]
                        + "</span> <span class=\"" + upClass
                        + "\""; 

                    inlineColor ? str += "style=\"color: " + color + ";\"" : null;
                    
                    str += ">" + change
                        + "  (" + p["percent_change"] + "%)</span>";
                    
                    span.innerHTML = str;
                    td.appendChild(span);
                    span = undefined;
                }
                
                var em = document.createElement("span");
                em.style.fontSize = "10px";
                em.style.fontStyle = "italic";
                em.style.paddingLeft = "15px";
                em.innerHTML = "powered by <a href=\"http://blacklotusproject.com\">blacklotusproject.com</a>";
                td.appendChild(em);
                em = undefined;

                if(!this.continuous) td.appendChild(spacer.cloneNode(true));

                var that = this;
                this.e.onmouseover = function(e) { that.pause(); };
                this.e.onmouseout = function(e) { that.animate(); };
                this.animate();

                /* Clean up the JSONP script */
                window[this.jsonp] = undefined;
                var head = document.getElementsByTagName("head")[0];
                if(head) {
                    head.removeChild(this.script);
                }
                try {
                    delete window[this.jsonp];
                    delete this.jsonp;
                    delete this.script;
                } catch(e){}
            },
            pause: function(e) {
                if (this.timeout) {
                    window.clearInterval(this.timeout);
                }
            },
            animate: function() {
                if(this.e) {
                    if(this.timeout) window.clearInterval(this.timeout);

                    /* Ticker.interval used here to set duration of scroll interval */
                    var that = this;
                    this.timeout = window.setInterval(function(){ that.tick() },
                        this.interval || 20);
                }
            },
            tick: function() {
                var el = this.e;

                /* Ticker.scroll option used here to pixels moved at each interval */
                el.scrollLeft += this.scroll || 1; 

                if(this.continuous) {
                    var td = el.getElementsByTagName("td")[0];
                    var span0 = td.getElementsByTagName("span")[0];
                    if(el.scrollLeft >= span0.offsetWidth) {
                        td.appendChild(span0);
                        el.scrollLeft -= span0.offsetWidth;
                    }
                } else {
                    /* Extra "- 1" to fix goofy calculation in Mac Firefox3 */
                    if(el.scrollLeft >= el.scrollWidth - el.offsetWidth - 1) el.scrollLeft = 0;
                }
            }
        };

        blp.EmbeddedSearchControl = function(){};
        blp.EmbeddedSearchControl.prototype = {
            draw: function(elementId) {
                if(elementId) {

                    var hideLabel = function(e) {
                        if(label && input) {
                            label.style.display = "none";
                        }
                    };

                    var showLabel = function(e) {
                        if(label && input && !input.value) {
                            label.style.display = "inline";
                        }
                    };

                    var validate = function(e) {
                        if(form && input) {
                            if(!input.value.replace(/^\s+|\s+$/g, '')) {
                                if(e && e.preventDefault) {
                                    e.preventDefault();
                                } else {
                                    window.event.returnValue = false;
                                }
                                return false;
                            }
                        }
                        return true;
                    };

                    var el = document.getElementById(elementId);
                    if(el) {
                        var markup = "<form style=\"width:100%;\""
                            + "action=\"http://blacklotusproject.com/cards/\""
                            + "method=\"get\"><table style=\"width:100%\"><tr><td>"
                            + "<label style=\"font-size:.8em;display: none;"
                            + "color:#999;position:absolute;line-height:22px;text-indent:5px;\""
                            + "for=\"blp_q\"><strong>Black Lotus Project</strong> Search</label>"
                            + "<input style=\"padding:2px;border:1px solid #BCCDF0;margin-right:.5em;"
                            + "width:99%\" type=\"text\" name=\"q\" id=\"blp_q\"></td>"
                            + "<td style=\"width:1%;\"><input style=\"margin-left:2px;\""
                            + "type=\"submit\" value=\"Search\"></td></tr></table</form>";
                        el.innerHTML = markup;
                        markup = null;

                        var label = el.getElementsByTagName("label")[0];
                        var input = el.getElementsByTagName("input")[0];
                        var form = el.getElementsByTagName("form")[0];
                        if(input) {
                            input.onfocus = hideLabel;
                            input.onblur = showLabel;
                        }
                        if(form) {
                            form.onsubmit = validate;
                        }
                        showLabel();
                    }
                }
            }
        };
    }
})();
