
if (typeof chrome === 'undefined') {
    window.chrome = {
        storage: {
            local: {
                get: function(keys, callback) {
                    setTimeout(() => {
                        try {
                            if (typeof keys === 'string') {
                                const value = localStorage.getItem(keys);
                                callback({ [keys]: value ? JSON.parse(value) : null });
                            } else if (Array.isArray(keys)) {
                                const result = {};
                                keys.forEach(key => {
                                    const value = localStorage.getItem(key);
                                    result[key] = value ? JSON.parse(value) : null;
                                });
                                callback(result);
                            } else {
                                const result = {};
                                for (const key of Object.keys(keys)) {
                                    const value = localStorage.getItem(key);
                                    result[key] = keys[key];
                                }
                                callback(result);
                            }
                        } catch (error) {
                            callback({});
                        }
                    }, 10);
                },
                set: function(items, callback) {
                    setTimeout(() => {
                        try {
                            for (const [key, value] of Object.entries(items)) {
                                localStorage.setItem(key, JSON.stringify(value));
                            }
                            if (callback) callback();
                        } catch (error) {
                            if (callback) callback();
                        }
                    }, 10);
                }
            }
        },
        runtime: {
            sendMessage: function(message, callback) {
                if (callback) {
                    setTimeout(() => {
                        callback({ success: false, error: 'Mock: Not implemented' });
                    }, 100);
                }
            },
            getURL: function(path) {
                return path;
            }
        },
        tabs: {
            create: function(options) {
            }
        }
    };

}
