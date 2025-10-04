export async function adminCheck(req, res, next) {
  try {
      console.log('adminCheck')
    req.user
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'You dont have permission to access this resource!' });
  }
}
