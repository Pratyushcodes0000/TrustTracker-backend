const generateTrackingId = () => {
  return 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

module.exports = generateTrackingId;
