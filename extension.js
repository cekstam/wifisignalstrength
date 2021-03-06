/*
 * Copyright 2015-2017 Tomi Leppänen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

const Lang = imports.lang;

const St = imports.gi.St;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const NetworkManager = imports.gi.NetworkManager;
const NMC = imports.gi.NMClient;

const WifiSignalMonitor = new Lang.Class({
    Name: 'WifiSignalMonitor',
    Extends: St.Bin,

    _init: function() {
        this.parent({ style_class: 'panel-button',
                      reactive: true,
                      can_focus: true,
                      x_fill: true,
                      y_fill: false,
                      track_hover: true });
        this._schema = Convenience.getSettings();
        this._timeout = null;
        this._waittime = this._schema.get_int('refresh-time');
        this._wifi = null;
        let layout = new St.BoxLayout();
        this._icon = new St.Icon({ icon_name: 'network-wireless-symbolic',
                                 style_class: 'system-status-icon' });
        layout.add_actor(this._icon);
        this._text = new St.Label({text: "N/A"});
        layout.add_actor(this._text);
        this.set_child(layout);
        this.connect('button-press-event', Lang.bind(this, this._updateText));

        NMC.Client.new_async(null, Lang.bind(this, function(obj, result) {
            let client = NMC.Client.new_finish(result);
            let devices = client.get_devices();
            for (let d = 0; d < devices.length; d++) {
                if (devices[d].get_device_type() ==
                        NetworkManager.DeviceType.WIFI)
                    this._wifi = devices[d];
            }
            this._updateText();
        }));
    },

    _updateText: function() {
        if (this._wifi) {
            let bitrate = this._wifi.get_bitrate()/1000;
            let strength = this._wifi.get_active_access_point().get_strength();
            this._text.text = "%d %%, %d Mb/s".format(strength, bitrate);
        } else
            this._text.text = "N/A";
        this._timeout = Mainloop.timeout_add_seconds(this._waittime,
                                            Lang.bind(this, this._updateText));
    }
});

function init() {
}

let wifiMonitor;

function enable() {
    wifiMonitor = new WifiSignalMonitor();
    Main.panel._rightBox.insert_child_at_index(wifiMonitor, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(wifiMonitor);
}
