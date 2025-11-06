const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0'
};

const cacheRules = {
  longCache: ['/prodi', '/dosen', '/mata-kuliah'],
  shortCache: ['/pengajuan-sa', '/mahasiswa'],
  noCache: ['/auth']
};

const setCacheHeaders = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    Object.entries(noCacheHeaders).forEach(([key, value]) => res.set(key, value));
    return next();
  }

  const path = req.path;
  const matchedRule = Object.entries(cacheRules).find(([_, paths]) => 
    paths.some(p => path.includes(p))
  );

  if (matchedRule?.[0] === 'noCache') {
    Object.entries(noCacheHeaders).forEach(([key, value]) => res.set(key, value));
  } else if (matchedRule?.[0] === 'longCache') {
    res.set('Cache-Control', 'public, max-age=300');
    res.set('ETag', `"${Date.now()}"`);
  } else if (matchedRule?.[0] === 'shortCache') {
    res.set('Cache-Control', 'public, max-age=60');
    res.set('ETag', `"${Date.now()}"`);
  } else {
    res.set('Cache-Control', 'public, max-age=30');
  }

  next();
};

module.exports = { setCacheHeaders };
