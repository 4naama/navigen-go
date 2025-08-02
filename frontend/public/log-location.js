exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Content-Type', 'application/json');

  const log = {
    name: event.name,
    lat: event.lat,
    lng: event.lng,
    time: new Date(parseInt(event.timestamp)).toISOString()
  };

  console.log('User selected:', log);

  // Later: write to file or DB or webhook
  response.setBody({ status: "logged", data: log });
  return callback(null, response);
};
