export async function moderatorCheck(req, res, next) {
  try {
    console.log('moderatorCheck ', req.user);
    req.user
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'You dont have permission to access this resource!' });
  }
}
