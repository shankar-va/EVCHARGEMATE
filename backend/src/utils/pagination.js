const pagination = (req, stations) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const totalStations = stations.length;
    const totalPages = Math.ceil(totalStations / limit);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const sortedData = [...stations].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
        if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
        return 0;
    });

    return { page, limit, skip, totalStations, totalPages, sortedData };
};


module.exports = pagination; 