export default {
    send: (error) => {
        throw new ZlickError(error);
    }
};

function ZlickError(error) {
    this.status = error.response.status;
    this.message = error.response.data;
}