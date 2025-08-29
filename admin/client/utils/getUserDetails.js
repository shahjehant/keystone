export function getUserDetails() {
    const apiHeaders = {
      headers: {
        'Cache-Control': 'no-cache',
        'Authorization': Keystone.user.token || '',
      },
    };
  
    return fetch(`${window.location.origin}/app/users/me`, apiHeaders)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((userDetails) => {
        const { user } = userDetails;
        return {
          user,
          canDelete: user.canDelete || user.role === 'SuperAdmin',
          canEdit: user.canEdit || user.role === 'SuperAdmin'

        };
      })
      .catch((e) => {
        console.error('Error fetching user:', e);
        return { user: null, canLogin: false, canDelete: false, canEdit: false };
      });
  }
