
export const createMyUser = async (customerMobno:string) => {

    const response = await fetch('/api/userRoutes', {
      method: 'POST',
      body: JSON.stringify({
        phone:customerMobno,
      }),
    })
  }